import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import Image from 'next/image'
import { useStore } from 'effector-react'
import {
    $modalWithdrawal,
    updateModalWithdrawal,
} from '../../../src/store/modal'
import { Withdrawals } from '../../'
import CloseReg from '../../../src/assets/icons/ic_cross.svg'
import CloseBlack from '../../../src/assets/icons/ic_cross_black.svg'
import { useTranslation } from 'next-i18next'
import { useSelector } from 'react-redux'
import { RootState } from '../../../src/app/reducers'

function Modal() {
    const modalWithdrawal = useStore($modalWithdrawal)
    const { t } = useTranslation()
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const Close = isLight ? CloseBlack : CloseReg

    if (!modalWithdrawal) {
        return null
    }

    return (
        <>
            <div
                className={styles.containerClose}
                onClick={() => updateModalWithdrawal(false)}
            />
            <div className={styles.container}>
                <div className={styles.innerContainer}>
                    <div className="closeIcon">
                        <Image
                            alt="close-ico"
                            src={Close}
                            onClick={() => updateModalWithdrawal(false)}
                        />
                    </div>
                    <h2 className={styles.txt}>{t('WITHDRAW FUNDS')}</h2>
                    <div className={styles.contentWrapper}>
                        <Withdrawals />
                    </div>
                </div>
            </div>
        </>
    )
}

export default Modal
