import React, { useEffect, useState } from 'react'
import { useStore } from 'effector-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { $doc } from '../../../../../src/store/did-doc'
import { $loading } from '../../../../../src/store/loading'
import { $user } from '../../../../../src/store/user'
import styles from './styles.module.scss'
import facebookIco from '../../../../../src/assets/icons/facebook_icon.svg'
import githubIco from '../../../../../src/assets/icons/github_icon.svg'
import instagramIco from '../../../../../src/assets/icons/instagram_icon.svg'
import linkedinIco from '../../../../../src/assets/icons/linkedin_icon.svg'
import twitterIco from '../../../../../src/assets/icons/twitter_icon.svg'
import othersocialIco from '../../../../../src/assets/icons/othersocial_icon.svg'
import addIco from '../../../../../src/assets/icons/add_icon.svg'

function Component() {
    const Router = useRouter()
    const doc = useStore($doc)?.doc
    const user = useStore($user)
    const loading = useStore($loading)

    const [serviceAvailable, setServiceAvaliable] = useState(false)

    useEffect(() => {
        console.log(doc)
    })

    return (
        <div className={styles.socialTreeWrapper}>
            <div
                onClick={() => Router.push(`/${user?.name}/did/funds`)}
                className={styles.addFunds}
            >
                <div className={styles.addFundsIco}>
                    <Image src={addIco} alt="ico-add" />
                </div>
                <div>ADD FUNDS</div>
            </div>
            <div className={styles.wrapper}>
                {doc !== null &&
                    doc?.map((res: any) => {
                        if (res[0] === 'DID services') {
                            if (!serviceAvailable) {
                                setServiceAvaliable(true)
                            }
                            return (
                                <div key={res}>
                                    {res[1].map((element: any) => {
                                        let socialIco = othersocialIco
                                        switch (
                                            element[1][0]
                                                .split('#')[0]
                                                .toLowerCase()
                                        ) {
                                            case 'bitcoin':
                                                'https://blockchain.coinmarketcap.com/address/bitcoin/'
                                                break
                                            case 'facebook':
                                                socialIco = facebookIco
                                                break
                                            case 'github':
                                                socialIco = githubIco
                                                break
                                            case 'instagram':
                                                socialIco = instagramIco
                                                break
                                            case 'linkedin':
                                                socialIco = linkedinIco
                                                break
                                            case 'twitter':
                                                socialIco = twitterIco
                                                break

                                            // @todo-x to get deprecated
                                            case 'phonenumber':
                                                return (
                                                    <div
                                                        className={
                                                            styles.docInfo
                                                        }
                                                    >
                                                        <p
                                                            key={element}
                                                            className={
                                                                styles.did
                                                            }
                                                        >
                                                            <span
                                                                className={
                                                                    styles.id
                                                                }
                                                            >
                                                                phone number{' '}
                                                            </span>
                                                            {element[1][1]}
                                                        </p>
                                                    </div>
                                                )
                                        }
                                        return (
                                            <div
                                                onClick={() =>
                                                    window.open(
                                                        `https://${element[1][1]
                                                            .replaceAll(
                                                                'wwww.',
                                                                ''
                                                            )
                                                            .replaceAll(
                                                                'https://',
                                                                ''
                                                            )}`
                                                    )
                                                }
                                                key={element}
                                                className={styles.flipCard}
                                            >
                                                <div
                                                    className={
                                                        styles.flipCardInner
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            backgroundColor: `#${
                                                                element[1][0].split(
                                                                    '#'
                                                                )[1]
                                                            }`,
                                                            borderColor: `#${
                                                                element[1][0].split(
                                                                    '#'
                                                                )[2]
                                                            }`,
                                                        }}
                                                        className={
                                                            styles.socialCardBack
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                color: `#${
                                                                    element[1][0].split(
                                                                        '#'
                                                                    )[2]
                                                                }`,
                                                            }}
                                                            className={
                                                                styles.txtDesc
                                                            }
                                                        >
                                                            {
                                                                element[1][0].split(
                                                                    '#'
                                                                )[3]
                                                            }
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            backgroundColor: `#${
                                                                element[1][0].split(
                                                                    '#'
                                                                )[2]
                                                            }`,
                                                            borderColor: `#${
                                                                element[1][0].split(
                                                                    '#'
                                                                )[1]
                                                            }`,
                                                        }}
                                                        className={
                                                            styles.socialCard
                                                        }
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    '18px',
                                                                color: `#${
                                                                    element[1][0].split(
                                                                        '#'
                                                                    )[1]
                                                                }`,
                                                            }}
                                                        >
                                                            {
                                                                element[1][0].split(
                                                                    '#'
                                                                )[0]
                                                            }
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.socialCardIco
                                                            }
                                                        >
                                                            <Image
                                                                src={socialIco}
                                                                alt="social-ico"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        }
                    })}
                {!serviceAvailable && (
                    <>
                        {loading ? (
                            <div>
                                <i
                                    style={{ color: '#ffff32' }}
                                    className="fa fa-lg fa-spin fa-circle-notch"
                                    aria-hidden="true"
                                ></i>
                            </div>
                        ) : (
                            <code>No data yet.</code>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default Component
