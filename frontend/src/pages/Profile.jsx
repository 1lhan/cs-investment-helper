import { batch, useSignal } from '@preact/signals-react';
import { formatDate, usePostRequest } from '../utils';
import { useNavigate } from 'react-router-dom';
import HeaderWithIcon from '../components/HeaderWithIcon';
import Form from '../components/Form';

export default function Profile({ user }) {
    const showUpdateUserInformationsModal = useSignal(false)
    const showChangePasswordModal = useSignal(false)
    const showDeleteAccountModal = useSignal(false)
    const navigate = useNavigate()

    const UpdateUserInformationsModal = () => {
        const updateUserInformationsFormMsg = useSignal(null)

        const updateUserInformations = async (e) => {
            const { username: { value: username }, email: { value: email } } = e.target.elements

            if (username == user.value.username && email == user.value.email) updateUserInformationsFormMsg.value = 'No changes detected in username or email.';
            else if (username.length < 3) updateUserInformationsFormMsg.value = 'Username must be at least 3 characters long.'
            else if (email.length < 15) updateUserInformationsFormMsg.value = 'Email must be at least 3 characters long.'
            else {
                const response = await usePostRequest('update-user-informations', { userId: user.value._id, token: document.cookie, username, email })
                if (!response.success) return updateUserInformationsFormMsg.value = response.msg

                e.target.reset()
                batch(() => {
                    user.value = response.user
                    updateUserInformationsFormMsg.value = null
                    showUpdateUserInformationsModal.value = false
                })
            }
        }

        if (!showUpdateUserInformationsModal.value) return null

        return (
            <div className="modal-backdrop">
                <div className="modal-container container">
                    <div className="update-user-informations-modal modal">
                        <Form title="Update User Informations" submitFunction={updateUserInformations}
                            onClickCloseBtn={() => batch(() => { showUpdateUserInformationsModal.value = false; updateUserInformationsFormMsg.value = null })} formMsgState={updateUserInformationsFormMsg}
                            submitBtnInnerText="Update User Informations"
                            fields={[{ align: 'column', fields: [{ name: 'username', type: 'text', defaultValue: user.value.username }, { name: 'email', type: 'email', defaultValue: user.value.email }] }]} />
                    </div>
                </div>
            </div>
        )
    }

    const ChangePasswordModal = () => {
        const changePasswordFormMsg = useSignal(null)

        const changePassword = async (e) => {
            const { currentPassword: { value: currentPassword }, newPassword: { value: newPassword }, newPasswordAgain: { value: newPasswordAgain } } = e.target.elements

            if (currentPassword.length < 8) changePasswordFormMsg.value = 'Current password must be at least 8 characters long.'
            else if (newPassword.length < 8) changePasswordFormMsg.value = 'New password must be at least 8 characters long.'
            else if (newPassword != newPasswordAgain) changePasswordFormMsg.value = 'New passwords do not match.'
            else if (currentPassword == newPassword) changePasswordFormMsg.value = 'Current password and new password cannot be the same.'
            else {
                const response = await usePostRequest('change-password', { userId: user.value._id, currentPassword, newPassword, token: document.cookie })
                if (!response.success) return changePasswordFormMsg.value = response.msg

                e.target.reset()
                batch(() => {
                    changePasswordFormMsg.value = null
                    showChangePasswordModal.value = false
                })
                alert('Your password has been successfully changed.')
            }
        }

        if (!showChangePasswordModal.value) return null

        return (
            <div className="modal-backdrop">
                <div className="modal-container container">
                    <div className="change-password-modal modal">
                        <Form title="Change Password" submitFunction={changePassword} onClickCloseBtn={() => batch(() => { showChangePasswordModal.value = false; changePasswordFormMsg.value = null })}
                            formMsgState={changePasswordFormMsg} submitBtnInnerText="Change Password"
                            fields={[{ align: 'column', fields: [{ name: 'currentPassword', type: 'password' }, { name: 'newPassword', type: 'password' }, { name: 'newPasswordAgain', type: 'password' }] }]} />
                    </div>
                </div>
            </div>
        )
    }

    const DeleteAccountModal = () => {
        const accountDeleteMsg = useSignal(null)

        const deleteAccount = async (e) => {
            e.preventDefault()

            const { username: { value: username } } = e.target.elements

            if (user.value?.accountType == 'admin') return accountDeleteMsg.value = 'You cannot delete an admin account.';
            else if (username != user.value.username) return accountDeleteMsg.value = 'The username entered is incorrect.'

            const userConfirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
            if (!userConfirmed) return;

            const response = await usePostRequest('delete-account', { userId: user.value._id, token: document.cookie })
            if (!response.success) return accountDeleteMsg.value = response.msg

            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            user.value = null
            alert('Your account has been successfully deleted.')
            navigate('/')
        }

        if (!showDeleteAccountModal.value) return null

        const DeleteAccountFormMsg = () => accountDeleteMsg.value && <span className="form-msg">{accountDeleteMsg.value}</span>

        return (
            <div className="modal-backdrop">
                <div className="modal-container container">
                    <div className="delete-account-modal modal">
                        <form onSubmit={deleteAccount}>
                            <div className="form-header">
                                <HeaderWithIcon title="Delete Account" iconClass="fa-solid fa-user-xmark" size="medium" />
                                <i className="close-btn fa-solid fa-xmark" onClick={() => batch(() => { showDeleteAccountModal.value = false; accountDeleteMsg.value = null })} />
                            </div>
                            <div className="form-body">
                                <span className="form-prompt">To delete your account, please type your name in the input field.</span>
                                <div className="fields-group">
                                    <div className="fields-group-item">
                                        <input name="username" type="text" />
                                    </div>
                                </div>
                            </div>
                            <DeleteAccountFormMsg />
                            <button className="btn" type="submit">Delete Account</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    if (!user.value) return <span className="msg-box" style={{ margin: '1rem auto' }}>Please log in to view profile</span>

    return (
        <div className="profile-page container">
            <header>
                <HeaderWithIcon title="Profile" iconClass="fa-regular fa-user" />
            </header>
            <section>
                <div className="section-item">
                    <div className="section-item-header">
                        <HeaderWithIcon title="Investments Market Price Last Update Date" iconClass="fa-regular fa-clock" size="medium" />
                    </div>
                    <div className="section-item-body">
                        <div>
                            <span>
                                {user.value.investmentsMarketPriceUpdateStatus.isUpdating ? 'Updating...' : formatDate(user.value.investmentsMarketPriceUpdateStatus.lastUpdateDate, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="section-item">
                    <div className="section-item-header">
                        <HeaderWithIcon title="User Informations" iconClass="fa-solid fa-circle-info" size="medium" />
                        <i className="fa-regular fa-pen-to-square" onClick={() => showUpdateUserInformationsModal.value = true} />
                    </div>
                    <div className="section-item-body">
                        <div>
                            <span>Username</span>
                            <span>{user.value.username}</span>
                        </div>
                        <div>
                            <span>Email</span>
                            <span>{user.value.email}</span>
                        </div>
                        <div>
                            <span>Membership Date</span>
                            <span>{formatDate(user.value.membershipDate)}</span>
                        </div>
                    </div>
                </div>
                <div className="buttons">
                    <button className="btn-secondary change-password-btn" onClick={() => showChangePasswordModal.value = true}>
                        <i className="fa-solid fa-key" />
                        <span>Change Password</span>
                    </button>
                    <button className="btn-secondary delete-account-btn" onClick={() => showDeleteAccountModal.value = true}>
                        <i className="fa-solid fa-user-xmark" />
                        <span>Delete Account</span>
                    </button>
                </div>
            </section>
            <UpdateUserInformationsModal />
            <ChangePasswordModal />
            <DeleteAccountModal />
        </div>
    )
}