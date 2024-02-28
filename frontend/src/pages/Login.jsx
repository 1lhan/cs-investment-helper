import { useSignal } from "@preact/signals-react";
import { NavLink, useNavigate } from "react-router-dom";
import { dynamicTitle, usePostRequest } from "../utils";

export default function Login({ user }) {
    const formMsg = useSignal('')
    const navigate = useNavigate()
    
    dynamicTitle(window.location.pathname.slice(1))

    const login = async (e) => {
        e.preventDefault()

        let { username, password } = e.target

        if (username.value.length < 2) formMsg.value = 'Username length can be atleast 2'
        else if (password.value.length < 8) formMsg.value = 'Password length can be atleast 8'
        else {
            let _login = await usePostRequest('/login', { username: username.value, password: password.value })

            if (_login.success) {
                let date = new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000)).toUTCString()
                let token = `token=${_login.token}; expires=${date};  path=/;`
                document.cookie = token

                user.value = _login.user
                navigate('/')
            }
            else formMsg.value = _login.msg
        }
    }

    return (
        <div className="login-page container">
            <div className="login-register-nav">
                <NavLink to='/login'>Login</NavLink>
                <hr />
                <NavLink to='/register'>Register</NavLink>
            </div>
            <form className="form" onSubmit={login}>
                <div className="form-header-div">
                    <h2 className="form-header">Login</h2>
                </div>
                <div className="form-body">
                    <div className="form-body-item">
                        <span>Username</span>
                        <input name="username" type="text" />
                    </div>
                    <div className="form-body-item">
                        <span>Password</span>
                        <input name="password" type="password" />
                    </div>
                    <span className="form-msg">{formMsg}</span>
                    <button className="submit-btn" type="submit">Login</button>
                </div>
            </form>
        </div>
    )
}