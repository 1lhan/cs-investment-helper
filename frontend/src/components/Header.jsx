import { NavLink, useNavigate } from "react-router-dom"
import { usePostRequest } from "../utils";

export default function Header({ user }) {
    const navigate = useNavigate()

    const headerToolsPages = [
        ['fa-solid fa-table-list', 'event-items-price-changes'],
        ['fa-solid fa-magnifying-glass-chart', 'major-analysis'],
        ['fa-regular fa-note-sticky', 'sticker-application-numbers'],
        ['fa-solid fa-calendar-days', 'events']
    ]

    const userMenuDropdownPages = [
        ['fa-regular fa-user', 'profile'],
        ['fa-solid fa-chart-line', 'investment-stats']
    ]

    const logout = () => {
        if (confirm('Are you sure you want log out')) {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            user.value = null
            navigate('/')
            window.location.reload()
        }
    }

    const updateInvestmentsMarketPrice = async () => {
        if (!user.value || user.value.investments.length == 0) return;

        const lastUpdateDateCheck = new Date() - new Date(user.value.investmentsMarketPriceUpdateStatus.lastUpdateDate) > (1000 * 60 * 30)
        const updateStartDateCheck = new Date() - new Date(user.value.investmentsMarketPriceUpdateStatus.updateStartDate) > (3200 * user.value.investments.length) + (1000 * 10)
        const isUpdating = user.value.investmentsMarketPriceUpdateStatus.isUpdating

        if (!lastUpdateDateCheck || (isUpdating && !updateStartDateCheck)) return;

        try {
            const permission = await fetch(import.meta.env.VITE_REACT_APP_BACKEND_URL + '/permission-to-update-investments-market-price/' + user.value._id).then(res => res.json())
            if (!permission.result || !permission.success) return;
        }
        catch (error) { return console.log(error) }

        try {
            const date = new Intl.DateTimeFormat(navigator.language, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())
            const response = await usePostRequest('/update-investments-market-price', { userId: user.value._id, date })

            if (response.success) user.value = response.user
        }
        catch (error) { console.error("An error occurred while updating investments:", error) }
    }
    updateInvestmentsMarketPrice()

    const hideHeaderMenuAfterPageChange = () => {
        if (document.getElementById("header-menu-cb")) document.getElementById("header-menu-cb").checked = false
    }

    return (
        <header className="header">
            <div className="container">
                <NavLink className="home-page-btn">CS Investment Helper</NavLink>

                <label className="header-menu-btn-label" htmlFor="header-menu-cb">
                    <i className="fa-solid fa-bars" />
                </label>

                <input id="header-menu-cb" type="checkbox" />

                <div className="header-group">
                    <i className="fa-solid fa-xmark" onClick={() => hideHeaderMenuAfterPageChange()} />
                    <NavLink className="to-investments-page-btn" to="/investments" onClick={() => hideHeaderMenuAfterPageChange()}>
                        <i className="fa-solid fa-hand-holding-dollar" />
                        <span>Investments</span>
                    </NavLink>

                    {user.value?.accountType == "admin" &&
                        <NavLink className="to-data-control-center-page-btn" to="/data-control-center" onClick={() => hideHeaderMenuAfterPageChange()}>
                            <i className="fa-solid fa-database" />
                            <span>Data Control Center</span>
                        </NavLink>
                    }

                    <span className="divider" />

                    <div className="tools-btn-container">
                        <button>
                            <i className="fa-solid fa-screwdriver-wrench" />
                            <span>Tools</span>
                        </button>
                        <div className="dropdown">
                            {headerToolsPages.map((item, index) =>
                                <NavLink className="dropdown-item" to={`/${item[1]}`} onClick={() => hideHeaderMenuAfterPageChange()} key={index}>
                                    <i className={item[0]} />
                                    <span>{item[1].replaceAll('-', ' ')}</span>
                                </NavLink>
                            )}
                        </div>
                    </div>

                    <span className="divider" />

                    {user.value ?
                        <div className="user-menu">
                            <label className="username" htmlFor="user-menu-dropdown-cb">{user.value.username}</label>
                            <input id="user-menu-dropdown-cb" type="checkbox" />
                            <div className="dropdown">
                                {userMenuDropdownPages.map((item, index) =>
                                    <NavLink className="dropdown-item" to={item[1]} onClick={() => { document.getElementById("user-menu-dropdown-cb").checked = false; hideHeaderMenuAfterPageChange() }} key={index}>
                                        <i className={item[0]} />
                                        <span>{item[1].replaceAll('-', ' ')}</span>
                                    </NavLink>
                                )}
                                <button className="dropdown-item" onClick={() => logout()}>
                                    <i className="fa-solid fa-arrow-right-from-bracket" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                        :
                        <NavLink className="to-login-page-btn" to="/login" onClick={() => hideHeaderMenuAfterPageChange()}>Log in</NavLink>
                    }
                </div>
            </div>
        </header>
    )
}