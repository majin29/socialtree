import * as tyron from 'tyron'
import * as zcrypto from '@zilliqa-js/crypto'
import React, { useEffect, useState } from 'react'
import { useStore } from 'effector-react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { $user } from '../../../../../src/store/user'
import { $arconnect } from '../../../../../src/store/arconnect'
import { $net } from '../../../../../src/store/wallet-network'
import { updateIsController } from '../../../../../src/store/controller'
import styles from './styles.module.scss'
import { ZilPayBase } from '../../../../ZilPay/zilpay-base'
import { decryptKey, operationKeyPair } from '../../../../../src/lib/dkms'
import { toast } from 'react-toastify'
import {
    setTxId,
    setTxStatusLoading,
    updateLoginInfoAddress,
    updateLoginInfoArAddress,
    updateLoginInfoUsername,
    updateLoginInfoZilpay,
} from '../../../../../src/app/actions'
import {
    updateDashboardState,
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../src/store/modal'
import controller from '../../../../../src/hooks/isController'
import { RootState } from '../../../../../src/app/reducers'
import { updateBuyInfo } from '../../../../../src/store/buyInfo'
import { updateLoggedIn } from '../../../../../src/store/loggedIn'

function Component() {
    const username = useStore($user)?.name
    const resolvedUsername = useSelector(
        (state: RootState) => state.modal.resolvedUsername
    )
    const arConnect = useStore($arconnect)
    const net = useStore($net)

    const Router = useRouter()
    const dispatch = useDispatch()

    const [hideDeactivate, setHideDeactivate] = useState(true)
    const [inputAddr, setInputAddr] = useState('')
    const [address, setAddress] = useState('')
    const [legend, setLegend] = useState('save')
    const [selectedAddress, setSelectedAddress] = useState('')
    const { isController } = controller()

    const is_operational =
        resolvedUsername?.status !== tyron.Sidetree.DIDStatus.Deactivated &&
        resolvedUsername?.status !== tyron.Sidetree.DIDStatus.Locked

    useEffect(() => {
        isController()
    })

    const submitDidDeactivate = async () => {
        // @info can't add loading since tx modal will pop up and it will cause error "React state update"
        try {
            if (arConnect !== null && resolvedUsername !== null) {
                const zilpay = new ZilPayBase()

                const key_: tyron.VerificationMethods.PublicKeyModel = {
                    id: 'deactivate',
                    key: '0x024caf04aa4f660db04adf65daf5b993b3383fcdb2ef0479ca8866b1336334b5b4',
                    encrypted: 'none',
                }
                const deactivate_element: tyron.DocumentModel.DocumentElement[] =
                    [
                        {
                            constructor:
                                tyron.DocumentModel.DocumentConstructor
                                    .VerificationMethod,
                            action: tyron.DocumentModel.Action.Add,
                            key: key_,
                        },
                    ]

                const hash = await tyron.DidCrud.default.HashDocument(
                    deactivate_element
                )

                const addr =
                    selectedAddress === 'SSI' ? resolvedUsername.addr : address
                const result: any = await tyron.SearchBarUtil.default.Resolve(
                    net,
                    addr
                )
                let signature: string = ''
                if (
                    Number(result.version.slice(8, 9)) < 5 ||
                    (Number(result.version.slice(8, 9)) >= 5 &&
                        Number(result.version.slice(10, 11)) <= 3)
                ) {
                    try {
                        const encrypted_key = result.dkms!.get('recovery')
                        const private_key = await decryptKey(
                            arConnect,
                            encrypted_key
                        )
                        const public_key =
                            zcrypto.getPubKeyFromPrivateKey(private_key)
                        signature = zcrypto.sign(
                            Buffer.from(hash, 'hex'),
                            private_key,
                            public_key
                        )
                    } catch (error) {
                        throw Error('Identity verification unsuccessful.')
                    }
                } else {
                    try {
                        const encrypted_key = result.dkms!.get('update')
                        const private_key = await decryptKey(
                            arConnect,
                            encrypted_key
                        )
                        const public_key =
                            zcrypto.getPubKeyFromPrivateKey(private_key)
                        signature = zcrypto.sign(
                            Buffer.from(hash, 'hex'),
                            private_key,
                            public_key
                        )
                    } catch (error) {
                        throw Error('Identity verification unsuccessful.')
                    }
                }

                const tyron_ = await tyron.TyronZil.default.OptionParam(
                    tyron.TyronZil.Option.none,
                    'Uint128'
                )

                const tx_params = await tyron.DidCrud.default.Deactivate({
                    addr:
                        selectedAddress === 'SSI'
                            ? resolvedUsername.addr
                            : address,
                    signature: signature,
                    tyron_: tyron_,
                })

                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                let tx = await tyron.Init.default.transaction(net)

                toast.info(
                    `You're about to submit a DID Deactivate operation!`,
                    {
                        position: 'top-center',
                        autoClose: 6000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'dark',
                    }
                )
                await zilpay
                    .call(
                        {
                            contractAddress:
                                selectedAddress === 'SSI'
                                    ? resolvedUsername.addr
                                    : address,
                            transition: 'DidDeactivate',
                            params: tx_params.txParams as unknown as Record<
                                string,
                                unknown
                            >[],
                            amount: String(0),
                        },
                        {
                            gasPrice: '2000',
                            gaslimit: '20000',
                        }
                    )
                    .then(async (res) => {
                        dispatch(setTxId(res.ID))
                        dispatch(setTxStatusLoading('submitted'))
                        try {
                            tx = await tx.confirm(res.ID)
                            if (tx.isConfirmed()) {
                                dispatch(setTxStatusLoading('confirmed'))
                                window.open(
                                    `https://devex.zilliqa.com/tx/${
                                        res.ID
                                    }?network=https%3A%2F%2F${
                                        net === 'mainnet' ? '' : 'dev-'
                                    }api.zilliqa.com`
                                )
                                logOff()
                                Router.push(`/`)
                            } else if (tx.isRejected()) {
                                dispatch(setTxStatusLoading('failed'))
                            }
                        } catch (err) {
                            throw err
                        }
                    })
                    .catch((err) => {
                        throw err
                    })
            }
        } catch (error) {
            dispatch(setTxStatusLoading('rejected'))
            toast.error(String(error), {
                position: 'top-right',
                autoClose: 6000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'dark',
                toastId: 12,
            })
        }
    }

    const handleOnChangeSelectedAddress = (event: {
        target: { value: any }
    }) => {
        setAddress('')
        setInputAddr('')
        setSelectedAddress(event.target.value)
    }

    const handleInputAddr = (event: { target: { value: any } }) => {
        setAddress('')
        setLegend('save')
        setInputAddr(event.target.value)
    }

    const handleOnKeyPress = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            validateInputAddr()
        }
    }

    const validateInputAddr = () => {
        const addr = tyron.Address.default.verification(inputAddr)
        if (addr !== '') {
            setAddress(addr)
            setLegend('saved')
        } else {
            toast.error(`Wrong address.`, {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'dark',
                toastId: 5,
            })
        }
    }

    const logOff = () => {
        updateLoggedIn(null)
        dispatch(updateLoginInfoAddress(null!))
        dispatch(updateLoginInfoUsername(null!))
        dispatch(updateLoginInfoZilpay(null!))
        updateDashboardState(null)
        dispatch(updateLoginInfoArAddress(null!))
        updateBuyInfo(null)
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'center',
                alignItems: 'center',
            }}
        >
            {/* {contract?.status === tyron.Sidetree.DIDStatus.Deployed && (
        <h2>
          <div
            onClick={() => {
              updateIsController(true);
              Router.push(`/${username}/did/wallet/crud/create`);
            }}
            className={styles.flipCard}
          >
            <div className={styles.flipCardInner}>
              <div className={styles.flipCardFront}>
                <p className={styles.cardTitle3}>CREATE</p>
              </div>
              <div className={styles.flipCardBack}>
                <p className={styles.cardTitle2}>GENERATE DID</p>
              </div>
            </div>
          </div>
        </h2>
      )} */}
            {is_operational && (
                <h2>
                    <div
                        onClick={() => {
                            updateIsController(true)
                            if (
                                resolvedUsername?.status ===
                                tyron.Sidetree.DIDStatus.Recovered
                            ) {
                                Router.push(
                                    `/${username}/did/wallet/crud/recover`
                                )
                            } else {
                                Router.push(
                                    `/${username}/did/wallet/crud/update`
                                )
                            }
                        }}
                        className={styles.flipCard}
                    >
                        <div className={styles.flipCardInner}>
                            <div className={styles.flipCardFront}>
                                <p className={styles.cardTitle3}>UPDATE</p>
                            </div>
                            <div className={styles.flipCardBack}>
                                <p className={styles.cardTitle2}>
                                    change document
                                </p>
                            </div>
                        </div>
                    </div>
                </h2>
            )}
            {/* <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {is_operational && (
          <h2>
            <div
              onClick={() => {
                updateIsController(true);
                Router.push(`/${username}/did/wallet/crud/recover`);
              }}
              className={styles.flipCard}
            >
              <div className={styles.flipCardInner}>
                <div className={styles.flipCardFront}>
                  <p className={styles.cardTitle3}>RECOVER</p>
                </div>
                <div className={styles.flipCardBack}>
                  <p className={styles.cardTitle2}>reset document</p>
                </div>
              </div>
            </div>
          </h2>
        )}
      </div> */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {is_operational && (
                    <h2>
                        <div
                            onClick={() => {
                                updateIsController(true)
                                Router.push(
                                    `/${username}/did/wallet/crud/social`
                                )
                            }}
                            className={styles.flipCard}
                        >
                            <div className={styles.flipCardInner}>
                                <div className={styles.flipCardFront}>
                                    <p className={styles.cardTitle3}>
                                        SOCIAL RECOVERY
                                    </p>
                                </div>
                                <div className={styles.flipCardBack}>
                                    <p className={styles.cardTitle2}>
                                        configure guardians
                                    </p>
                                </div>
                            </div>
                        </div>
                    </h2>
                )}
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: 10,
                }}
            >
                {/* {is_operational &&
          contract?.status !== tyron.Sidetree.DIDStatus.Deployed && ( */}
                {is_operational && (
                    <>
                        {hideDeactivate ? (
                            <>
                                <h5 style={{ color: 'red', marginTop: '10%' }}>
                                    Danger zone
                                </h5>
                                <h2>
                                    <div
                                        onClick={() => {
                                            setHideDeactivate(false)
                                        }}
                                        className={styles.flipCard}
                                    >
                                        <div className={styles.flipCardInner}>
                                            <div
                                                className={
                                                    styles.flipCardFront2
                                                }
                                            >
                                                <p
                                                    className={
                                                        styles.cardTitle3
                                                    }
                                                >
                                                    DEACTIVATE
                                                </p>
                                            </div>
                                            <div
                                                className={styles.flipCardBack}
                                            >
                                                <p
                                                    className={
                                                        styles.cardTitle2
                                                    }
                                                >
                                                    permanent deactivation
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </h2>
                            </>
                        ) : (
                            <div style={{ marginTop: '7%' }}>
                                <h2
                                    style={{
                                        color: 'red',
                                        letterSpacing: 'unset',
                                    }}
                                >
                                    DID deactivate
                                </h2>
                                <div>
                                    <select
                                        className={styles.select}
                                        onChange={handleOnChangeSelectedAddress}
                                        value={selectedAddress}
                                    >
                                        <option value="">Select address</option>
                                        <option value="SSI">This SSI</option>
                                        <option value="ADDR">
                                            Another address
                                        </option>
                                    </select>
                                </div>
                                {selectedAddress === 'ADDR' && (
                                    <div className={styles.wrapperInputAddr}>
                                        <input
                                            type="text"
                                            style={{ marginRight: '3%' }}
                                            onChange={handleInputAddr}
                                            onKeyPress={handleOnKeyPress}
                                            placeholder="Type address"
                                            autoFocus
                                        />
                                        <button
                                            onClick={validateInputAddr}
                                            className={
                                                legend === 'save'
                                                    ? 'button primary'
                                                    : 'button secondary'
                                            }
                                        >
                                            <p>{legend}</p>
                                        </button>
                                    </div>
                                )}
                                {selectedAddress === 'SSI' ||
                                (selectedAddress === 'ADDR' &&
                                    address !== '') ? (
                                    <div style={{ marginTop: '5%' }}>
                                        <p>
                                            Are you sure? There is no way back.
                                        </p>
                                        <button
                                            className={styles.deactivateYes}
                                            onClick={submitDidDeactivate}
                                        >
                                            <p>YES</p>
                                        </button>
                                        <button
                                            className={styles.deactivateNo}
                                            onClick={() => {
                                                setHideDeactivate(true)
                                                setSelectedAddress('')
                                                setInputAddr('')
                                                setAddress('')
                                            }}
                                        >
                                            <p>NO</p>
                                        </button>
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default Component
