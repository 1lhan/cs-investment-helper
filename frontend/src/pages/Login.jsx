import { useSignal } from '@preact/signals-react';
import { usePostRequest } from '../utils';
import { NavLink, useNavigate } from 'react-router-dom';
import Form from '../components/Form';

export default function Login({ user }) {
    const loginFormMsg = useSignal(null)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        const { username: { value: username }, password: { value: password } } = e.target

        if (username.length < 3) loginFormMsg.value = 'Username must be at least 3 characters long.'
        else if (password.length < 8) loginFormMsg.value = 'Password must be at least 8 characters long.'
        else {
            const response = await usePostRequest('login', { username, password })
            
            if (!response.success) return loginFormMsg.value = response.msg
            const date = new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000)).toUTCString()
            document.cookie = `token=${response.token}; expires=${date}; path=/; secure; sameSite=Strict`

            user.value = response.user
            navigate('/')
        }
    }

    return (
        <div className="login-page container">
            <div className="form-wrapper">
                <Form title="Log In" submitFunction={handleLogin} formMsgState={loginFormMsg} submitBtnInnerText="Log In"
                    fields={[{ align: 'column', fields: [{ name: 'username', type: 'text' }, { name: 'password', type: 'password' }] }]} />
            </div>
            <NavLink className="to-signup-link" to="/signup">Create an account</NavLink>
        </div>
    )
}