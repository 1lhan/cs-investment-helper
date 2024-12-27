import React from 'react'
import ReactDOM from 'react-dom/client'
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { signal } from '@preact/signals-react'
import Header from './components/Header'
import Investments from './pages/Investments/Investments'
import Home from './pages/Home'
import './Style/main.css'
import Login from './pages/Login'
import EventItemsPriceChanges from './pages/EventItemsPriceChanges'
import Events from './pages/Events'
import InvestmentStats from './pages/InvestmentStats'
import DataControlCenter from './pages/DataControlCenter'
import StickerApplicationNumbers from './pages/StickerApplicationNumbers'
import Signup from './pages/SignUp'
import Profile from './pages/Profile'
import MajorAnalysis from './pages/MajorAnalysis'

const autoLogin = async () => {
    const timeout = new Promise((_, reject) => { setTimeout(() => reject(new Error('Request timed out')), 5000) })
    try {
        const response = await Promise.race([
            fetch(import.meta.env.VITE_REACT_APP_BACKEND_URL + '/auto-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: document.cookie })
            }),
            timeout
        ])

        if (!response.ok) throw new Error('Network response was not ok');

        let data = await response.json()
        if (!data.success) return null

        return data.user
    }
    catch (error) { return null }
};

const user = signal(await autoLogin())


const itemTypes = ['Sticker', 'Autograph', 'Capsule', 'Souvenir Package', 'Case', 'Patch', 'Charm']

const router = createBrowserRouter([
    {
        element: <><Header user={user} /><Outlet /></>,
        children: [
            {
                path: '/',
                element: <Home />
            },
            {
                path: '/investments',
                element: <Investments user={user} />
            },
            {
                path: '/data-control-center',
                element: <DataControlCenter user={user} />
            },
            {
                path: '/event-items-price-changes',
                element: <EventItemsPriceChanges itemTypes={itemTypes} />
            },
            {
                path: '/major-analysis',
                element: <MajorAnalysis />
            },
            {
                path: '/sticker-application-numbers',
                element: <StickerApplicationNumbers />
            },
            {
                path: '/events',
                element: <Events />
            },
            {
                path: '/login',
                element: <Login user={user} />
            },
            {
                path: '/signup',
                element: <Signup />
            },
            {
                path: '/profile',
                element: <Profile user={user} />
            },
            {
                path: '/investment-stats',
                element: <InvestmentStats user={user} />
            }
        ]
    }
])

ReactDOM.createRoot(document.getElementById('root')).render(
    <RouterProvider router={router} />
)