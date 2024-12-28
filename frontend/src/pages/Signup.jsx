import { useSignal } from '@preact/signals-react'
import { usePostRequest } from '../utils'
import { useNavigate } from 'react-router-dom'
import Form from '../components/Form'

export default function Signup() {
    const registerFormMsg = useSignal(null)
    const navigate = useNavigate()

    const handleSignup = async (e) => {
        const { username: { value: username }, email: { value: email }, password: { value: password }, confirmPassword: { value: confirmPassword } } = e.target.elements

        if (username.length < 3) registerFormMsg.value = 'Username must be at least 3 characters long.'
        else if (email.length < 15) registerFormMsg.value = 'Email must be at least 15 characters long.'
        else if (password.length < 8) registerFormMsg.value = 'Password must be at least 8 characters long.'
        else if (password != confirmPassword) registerFormMsg.value = 'Passwords do not match.'
        else {
            const response = await usePostRequest('signup', { username, email, password })
            if (!response.success) return registerFormMsg.value = response.msg

            e.target.reset()
            registerFormMsg.value = null
            alert('Account has been created.')
            navigate('/login')
        }
    }

    return (
        <div className="signup-page container">
            <div className="form-wrapper">
                <Form title="Signup" submitFunction={handleSignup} formMsgState={registerFormMsg} submitBtnInnerText="Signup"
                    fields={[{ align: 'column', fields: [{ name: 'username', type: 'text' }, { name: 'email', type: 'email' }, { name: 'password', type: 'password' }, { name: 'confirmPassword', type: 'password' }] }]} />
            </div>
        </div>
    )
}