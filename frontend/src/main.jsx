import React from 'react'
import ReactDOM from 'react-dom/client'
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { signal } from '@preact/signals-react'

import './style/style.css'
import './style/MultipleDataSetLineChartStyle.css'
import './style/MultipleValueColumnChartStyle.css'
import Header from './components/Header'
import DataControlCenter from './pages/DataControlCenter'
import slice from './slice'
import MajorItemsPriceChanges from './pages/MajorItemsPriceChanges'
import Home from './pages/Home'
import EventDates from './pages/EventDates'
import OperationItemsPricesChanges from './pages/OperationItemsPriceChanges'
import MajorAnalysisCenter from './pages/MajorAnalysisCenter'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Investments from './pages/Investments'

const autoLogin = async () => {
    let _autoLogin = await fetch(import.meta.env.VITE_REACT_APP_BACKEND_URL + '/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: document.cookie })
    }).then(res => res.json())

    return _autoLogin.success ? _autoLogin.user : false
}
const user = signal(await autoLogin())

const router = createBrowserRouter([
    {
        element: <><Header user={user} /><Outlet /></>,
        children: [
            {
                path: '/',
                element: <Home />
            },
            {
                path: '/major-items-price-changes',
                element: <MajorItemsPriceChanges />
            },
            {
                path: '/operation-items-price-changes',
                element: <OperationItemsPricesChanges />
            },
            {
                path: '/major-analysis-center',
                element: <MajorAnalysisCenter />
            },
            {
                path: '/data-control-center',
                element: <DataControlCenter user={user} />
            },
            {
                path: '/event-dates',
                element: <EventDates />
            },
            {
                path: '/login',
                element: <Login user={user} />
            },
            {
                path: '/register',
                element: <Register />
            },
            {
                path: '/profile',
                element: <Profile user={user} />
            },
            {
                path: '/investments/:username',
                element: <Investments user={user} />
            }
        ]
    }
])

const store = configureStore({
    reducer: { slice }
})

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </Provider>
)
