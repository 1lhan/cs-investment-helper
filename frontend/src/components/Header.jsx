import { NavLink, useNavigate } from "react-router-dom";
import { formatDate, usePostRequest } from "../utils";

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

    const updateInvestmentMarketPrices = async () => {
        if (!user.value || user.value.investments.length == 0 || user.value.investments.filter(item => item.quantity > 0).length == 0) return;

        const lastUpdateDateCheck = new Date() - new Date(user.value.investmentsMarketPriceUpdateStatus.lastUpdateDate) > (1000 * 60 * 30)
        const updateStartDateCheck = new Date() - new Date(user.value.investmentsMarketPriceUpdateStatus.updateStartDate) > (3200 * user.value.investments.length) + (1000 * 10)
        const isUpdating = user.value.investmentsMarketPriceUpdateStatus.isUpdating

        if (!lastUpdateDateCheck || (isUpdating && !updateStartDateCheck)) return;

        const response = await usePostRequest('update-investment-market-prices', { userId: user.value._id, token: document.cookie, date: formatDate(new Date()) })
    }
    updateInvestmentMarketPrices()

    return (
        <header className="header">
            <div className="container">
                <NavLink className="home-page-btn">CS Investment Helper</NavLink>

                <div className="header-content">
                    <NavLink className="header-btn" to="/investments">
                        <i className="fa-solid fa-hand-holding-dollar" />
                        <span>Investments</span>
                    </NavLink>

                    {user.value?.accountType == 'admin' &&
                        <NavLink className="header-btn" to="/data-control-center">
                            <i className="fa-solid fa-database" />
                            <span>Data Control Center</span>
                        </NavLink>
                    }

                    <div className="tools-btn-wrapper">
                        <div className="tools-btn header-btn">
                            <i className="fa-solid fa-screwdriver-wrench" />
                            <span>Tools</span>
                        </div>
                        <div className="dropdown">
                            {headerToolsPages.map((page, pageIndex) =>
                                <NavLink className="dropdown-item" to={'/' + page[1]} key={pageIndex}>
                                    <i className={page[0]} />
                                    <span>{page[1].replaceAll('-', ' ')}</span>
                                </NavLink>
                            )}
                        </div>
                    </div>

                    {!user.value ? <NavLink className="to-login-page-btn" to="/login">Log in</NavLink> :
                        <div className="user-menu">
                            <label htmlFor="user-menu-dropdown-cb">{user.value.username}</label>
                            <input id="user-menu-dropdown-cb" type="checkbox" />
                            <div className="dropdown">
                                {userMenuDropdownPages.map((page, pageIndex) =>
                                    <NavLink className="dropdown-item" to={page[1]} onClick={() => document.getElementById('user-menu-dropdown-cb').checked = false} key={pageIndex}>
                                        <i className={page[0]} />
                                        <span>{page[1].replaceAll('-', ' ')}</span>
                                    </NavLink>
                                )}
                                <button className="dropdown-item" onClick={() => logout()}>
                                    <i className="fa-solid fa-arrow-right-from-bracket" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </header>
    )
}