import React from 'react'
import ReactDOM from 'react-dom/client'
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { signal } from '@preact/signals-react'

import Header from './components/Header'
import Home from './pages/Home'
import Investments from './pages/Investments/Investments'
import DataControlCenter from './pages/DataControlCenter'
import EventItemsPriceChanges from './pages/EventItemsPriceChanges'
import MajorAnalysis from './pages/MajorAnalysis'
import StickerApplicationNumbers from './pages/StickerApplicationNumbers'
import Events from './pages/Events'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import InvestmentStats from './pages/InvestmentStats'

import './style/main.css'

const autoLogin = async () => {
    const timeout = new Promise((_, reject) => { setTimeout(() => reject(), 5000) })
    try {
        const response = await Promise.race([
            fetch(import.meta.env.VITE_REACT_APP_BACKEND_URL + '/auto-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: document.cookie })
            }),
            timeout
        ])

        if (!response.ok) return null

        let data = await response.json()
        if (!data.success) return null

        return data.user
    }
    catch (error) { return null }
}

const user = signal(await autoLogin())

const itemTypes = ['Charm', 'Collectible', 'Souvenir Package', 'Capsule', 'Pass', 'Patch', 'Sticker']
const variants = ['Paper', 'Glitter', 'Holo', 'Foil', 'Gold', 'Lenticular']

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
                element: <Investments user={user} itemTypes={itemTypes} variants={variants} />
            },
            {
                path: '/data-control-center',
                element: <DataControlCenter user={user} />
            },
            {
                path: '/event-items-price-changes',
                element: <EventItemsPriceChanges />
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