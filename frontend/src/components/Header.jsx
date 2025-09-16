import { NavLink, useNavigate } from 'react-router-dom';
import { formatDate, usePostRequest } from '../utils';
import { useEffect } from 'react';

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
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            user.value = null
            navigate('/')
            window.location.reload()
        }
    }

    const updateInvestmentMarketPrices = async () => {
        if (user.value.investments.length == 0 || user.value.investments.filter(item => item.quantity > 0).length == 0) return;

        const lastUpdateDateCheck = new Date() - new Date(user.value.investmentsMarketPriceUpdateStatus.lastUpdateDate) > (1000 * 60 * 60)
        const updateStartDateCheck = new Date() - new Date(user.value.investmentsMarketPriceUpdateStatus.updateStartDate) > (3200 * user.value.investments.length) + (1000 * 10)
        const isUpdating = user.value.investmentsMarketPriceUpdateStatus.isUpdating

        if (!lastUpdateDateCheck || (isUpdating && !updateStartDateCheck)) return;

        const response = await usePostRequest('update-investment-market-prices', { userId: user.value._id, token: document.cookie, date: formatDate(new Date()) })
        if (response.user) user.value = response.user
    }

    const closeHeaderContent = () => {
        if (window.innerWidth > 768) return;
        document.getElementById('header-content-cb').checked = false
    }

    useEffect(() => {
        if (user.value) {
            const timer = setTimeout(() => { updateInvestmentMarketPrices() }, 30000)
            return () => clearTimeout(timer)
        }
    }, [])

    useEffect(() => {
        document.title = document.location.pathname == '/' ? 'CSIH' : document.location.pathname.slice(1).split('-').map(item => item[0].toUpperCase() + item.slice(1)).join(' ') + ' / CSIH'
    }, [window.location.pathname])

    return (
        <header className="header">
            <div className="container">
                <NavLink className="home-page-btn">CS Investment Helper</NavLink>

                <label className="hamburger-menu-btn-label" htmlFor="header-content-cb">
                    <i className="fa-solid fa-bars" />
                </label>

                <input id="header-content-cb" type="checkbox" />

                <div className="header-content">
                    <i className="fa-solid fa-xmark close-btn" onClick={() => closeHeaderContent()} />

                    <NavLink className="header-btn" to="/investments" onClick={() => closeHeaderContent()}>
                        <i className="fa-solid fa-hand-holding-dollar" />
                        <span>Investments</span>
                    </NavLink>

                    {user.value?.accountType == 'admin' &&
                        <NavLink className="header-btn" to="/data-control-center" onClick={() => closeHeaderContent()}>
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
                                <NavLink className="dropdown-item" to={'/' + page[1]} key={pageIndex} onClick={() => closeHeaderContent()}>
                                    <i className={page[0]} />
                                    <span>{page[1].replaceAll('-', ' ')}</span>
                                </NavLink>
                            )}
                        </div>
                    </div>

                    {!user.value ? <NavLink className="to-login-page-btn" to="/login" onClick={() => closeHeaderContent()}>Log in</NavLink> :
                        <div className="user-menu">
                            <label htmlFor="user-menu-dropdown-cb">{user.value.username}</label>
                            <input id="user-menu-dropdown-cb" type="checkbox" />
                            <div className="dropdown">
                                {userMenuDropdownPages.map((page, pageIndex) =>
                                    <NavLink className="dropdown-item" to={page[1]} onClick={() => { document.getElementById('user-menu-dropdown-cb').checked = false; closeHeaderContent() }} key={pageIndex}>
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