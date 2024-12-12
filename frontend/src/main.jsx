import React from 'react'
import ReactDOM from 'react-dom/client'
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { signal } from '@preact/signals-react'

import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import './style/style.css'
import Events from './pages/Events.jsx'
import DataControlCenter from './pages/DataControlCenter.jsx'
import EventItemsPriceChanges from './pages/EventItemsPriceChanges.jsx'
import MajorAnalysis from './pages/MajorAnalysis.jsx'
import StickerApplicationNumbers from './pages/StickerApplicationNumbers.jsx'
import Investments from './pages/Investments.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import InvestmentStats from './pages/InvestmentStats.jsx'
import Profile from './pages/Profile.jsx'

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

        const data = await response.json()
        return data.success ? data.user : null
    }
    catch (error) { return null }
};

const user = signal(await autoLogin())

const blue = "#066edd"
const green = '#34d399';
const red = '#ff6c6c';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
})

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
                element: <Investments user={user} blue={blue} green={green} red={red} />
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
                element: <StickerApplicationNumbers green={green} red={red} />
            },
            {
                path: '/events',
                element: <Events />
            },
            {
                path: '/profile',
                element: <Profile user={user} />
            },
            {
                path: '/investment-stats',
                element: <InvestmentStats user={user} />
            },
            {
                path: '/login',
                element: <Login user={user} />
            },
            {
                path: '/signup',
                element: <Signup />
            }
        ]
    }
])

ReactDOM.createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
    </QueryClientProvider>
)