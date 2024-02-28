import { useSignal } from "@preact/signals-react"
import { NavLink } from "react-router-dom"
import { dynamicTitle, usePostRequest } from "../utils"

export default function Register() {
    const formMsg = useSignal('')
    
    dynamicTitle(window.location.pathname.slice(1))

    const register = async (e) => {
        e.preventDefault()

        let { username, email, password, passwordAgain } = e.target

        if (username.value.length < 2) formMsg.value = 'Username length can be atleast 2'
        else if (password.value.length < 8) formMsg.value = 'Password length can be atleast 8'
        else if (password.value != passwordAgain.value) formMsg.value = 'Passwords are not same'
        else {
            let _register = await usePostRequest('/register', { username: username.value, email: email.value, password: password.value })

            if (_register.success) {
                e.target.reset()
                formMsg.value = 'Account created'
            }
            else formMsg.value = _register.msg || 'Account could not created'
        }
    }

    return (
        <div className="register-page container">
            <div className="login-register-nav">
                <NavLink to='/login'>Login</NavLink>
                <hr />
                <NavLink to='/register'>Register</NavLink>
            </div>
            <form className="form" onSubmit={register}>
                <div className="form-header-div">
                    <h2 className="form-header">Register</h2>
                </div>
                <div className="form-body">
                    <div className="form-body-item">
                        <span>Username</span>
                        <input name="username" type="text" />
                    </div>
                    <div className="form-body-item">
                        <span>Email</span>
                        <input name="email" type="email" />
                    </div>
                    <div className="form-body-item">
                        <span>Password</span>
                        <input name="password" type="password" />
                    </div>
                    <div className="form-body-item">
                        <span>Password (Again)</span>
                        <input name="passwordAgain" type="password" />
                    </div>
                    <span className="form-msg">{formMsg}</span>
                    <button className="submit-btn" type="submit">Register</button>
                </div>
            </form>
        </div>
    )
}