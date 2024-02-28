import { NavLink } from 'react-router-dom'

export default function Header({ user }) {
    const onClickNavItem = () => {
        document.getElementById('header-nav-cb').checked = false
    }

    return (
        <header>
            <div className="header-div">
                <NavLink className="home-btn" to='/'>CS Investment Helper</NavLink>
                <button className='hamburger-btn'>
                    <label htmlFor='header-nav-cb'>
                        <i className="fa-solid fa-bars" />
                    </label>
                </button>
                <input id='header-nav-cb' type='checkbox' />
                <nav>
                    {user.value &&
                        <NavLink className="nav-item" to={`/investments/${user.value.username}`} onClick={() => onClickNavItem()}>
                            <i className="fa-solid fa-hand-holding-dollar" />
                            <span>Investments</span>
                        </NavLink>
                    }
                    <div className='nav-item tools-btn'>
                        <i className="fa-solid fa-screwdriver-wrench" />
                        <span>Tools</span>
                        <div className='tools-btn-dropdown'>
                            <NavLink to='/major-items-price-changes' onClick={() => onClickNavItem()}>
                                <i className="fa-solid fa-table-list" />
                                <span>Major Items Price Changes</span>
                            </NavLink>
                            <NavLink to='/operation-items-price-changes' onClick={() => onClickNavItem()}>
                                <i className="fa-solid fa-table-list" />
                                <span>Operation Items Price Changes</span>
                            </NavLink>
                            <NavLink to='/major-analysis-center'>
                                <i className="fa-solid fa-magnifying-glass-chart" onClick={() => onClickNavItem()} />
                                <span>Major Analysis Center</span>
                            </NavLink>
                            <NavLink to='/event-dates'>
                                <i className="fa-solid fa-calendar-days" onClick={() => onClickNavItem()} />
                                <span>Event Dates</span>
                            </NavLink>
                        </div>
                    </div>
                    {user.value?.accountInformations?.accountType == 'admin' &&
                        <NavLink to='/data-control-center' className="nav-item" onClick={() => onClickNavItem()}>
                            <i className="fa-solid fa-database" />
                            <span>Data Control Center</span>
                        </NavLink>
                    }
                    {user.value ?
                        <NavLink className="nav-item profile-btn" to='/profile' onClick={() => onClickNavItem()}>
                            <i className="fa-regular fa-user" />
                            <span>{user.value.username}</span>
                        </NavLink>
                        :
                        <NavLink to='/login' className="nav-item login-btn" onClick={() => onClickNavItem()}>
                            <i className="fa-regular fa-user" />
                            <span>Login</span>
                        </NavLink>
                    }
                </nav>
            </div>
        </header>
    )
}