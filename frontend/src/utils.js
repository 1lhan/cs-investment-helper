import Big from "big.js"
import { events } from "./events"

export const splitCamelCase = str => str.replace(/([a-z])([A-Z])/g, '$1 $2')

export const monthDiff = (date1, date2) => Math.round((date2.getFullYear() - date1.getFullYear()) * 12 + date2.getMonth() - date1.getMonth() + (date2.getDate() - date1.getDate()) / 30)

export const big = (value) => new Big(value)

export const formatDate = (date, options = {}) => {
    const dateObj = date instanceof Date ? date : new Date(date)

    const defaultOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: undefined,
        minute: undefined,
        timeZone: undefined
    }

    const mergedOptions = { ...defaultOptions, ...options }

    return new Intl.DateTimeFormat(navigator.language, mergedOptions).format(dateObj)
}

export const useGetRequest = async (endpoint) => {
    try {
        const response = await fetch(import.meta.env.VITE_REACT_APP_BACKEND_URL + '/' + endpoint)

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data = await response.json()
        return data
    }
    catch (error) { return { success: false, msg: "An error occurred while processing your request." } }
}

export const usePostRequest = async (endpoint, requestBody) => {
    try {
        const response = await fetch(import.meta.env.VITE_REACT_APP_BACKEND_URL + '/' + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`)

        const data = await response.json()
        return data
    }
    catch (error) { return { success: false, msg: "An error occurred while processing your request." } }
}

export const calculateDateFilterIndex = (date, item, _eventName, dateType, period) => {
    if (!period) {
        const index = item.findIndex(item => item[0] == new Date(date).toDateString().slice(4))
        return index != -1 ? index : (dateType == 'start' ? 0 : undefined)
    }
    else {
        if (period == '1 Year After Release') return dateType == 'start' ? 0 : 365
        else if (period == '2 Years After Release') return dateType == 'start' ? 365 : 730
        else if (period == 'Sale Period') {
            const event = events.find(event => event.name == _eventName)
            return item.findIndex(item => item[0] == new Date(dateType == 'start' ? event.saleStartDate : event.endDate).toDateString().slice(4))
        }
        else if (period == 'First Month Of Sale') {
            const event = events.find(event => event.name == _eventName)
            const firstDayIndex = item.findIndex(item => item[0] == new Date(event.saleStartDate).toDateString().slice(4))
            return dateType == 'start' ? firstDayIndex : firstDayIndex + 30
        }
        else if (period == 'Last Month') return dateType == 'start' ? -30 : undefined
        else if (period == 'Last 3 Months') return dateType == 'start' ? -90 : undefined
    }
}

export const calculateYAxisValues = (data, yKey, numIntervals) => {
    const sortedData = data.slice().sort((a, b) => b[yKey] - a[yKey])
    const highestValue = sortedData[0][yKey] // 14.74
    const lowestValue = sortedData[sortedData.length - 1][yKey] // 19.4

    let yAxisValues = []

    if (lowestValue > 1) {
        let _1 = Math.pow(10, String(Math.floor(lowestValue)).length - 1) // Math.floor(14.74) = 14, String(14).length - 1 = 1, Math.pow(10, 1) = 10
        let _2 = Math.floor(lowestValue / _1) // Math.floor(14.74 / 10) => Math.floor(1.474) => 1
        yAxisValues.push(_1 * _2) // 10 * 1 = 10
    }
    else yAxisValues.push((Math.floor(lowestValue * 10) / 10))

    if (highestValue > 1) {
        let _1 = Math.pow(10, String(Math.floor(highestValue)).length - 1) // Math.floor(19) = 10, String(19).length - 1 = 1, Math.pow(10, 1) = 10
        let _2 = Math.ceil(highestValue / _1) // Math.ceil(19.4 / 10) => Math.ceil(1.94) => 2
        yAxisValues.push(_1 * _2) // 10 * 2 = 20
    }
    else yAxisValues.push((Math.ceil(highestValue * 10) / 10))

    // yAxisValues = [10, 20]
    // numIntervals = 3

    if (numIntervals > 0) {
        const lowestYAxisValue = yAxisValues[0] // 10
        const highestYAxisValue = yAxisValues[yAxisValues.length - 1] // 20
        const intervalSize = (highestYAxisValue - lowestYAxisValue) / (numIntervals + 1) // (20 - 10 / (3 + 1)) = 2.5

        for (let i = 1; i <= numIntervals; i++) { yAxisValues.splice(i, 0, lowestYAxisValue + (intervalSize * i)) }
    }

    return yAxisValues.reverse()
}

export const formatItemNames = (event, type, variant) => {
    // _ir: item name replace, _er: event name replace
    const templates = {
        Sticker: 'Sticker | _ir | _er',
        'Souvenir Package': '_er _ir Souvenir Package',
        Patch: 'Patch | _ir',
        Charm: 'Charm | _ir'
    }

    const eventName = event.name
    const items = event.items[type]
    let result = []

    if (type == 'Sticker' || type == 'Autograph') {
        result = items.map(item => { return templates.Sticker.replace('_ir', !variant || variant == 'Paper' ? item : `${item} (${variant})`).replace(' | _er', event.type == 'tournament' ? ` | ${eventName}` : '') })

        if (eventName == 'Paris 2023' && type == 'Autograph') result.push(variant == 'Paper' ? event.specificItems[type][0] : event.specificItems[type].find(item => item.includes(variant)))

        if (type == 'Autograph' && event.championAutograph) {
            result = result.concat(event.championAutograph.map(item => {
                return templates.Sticker.replace('_ir', variant == 'Paper' ? `${item} (Champion)` : `${item} (${variant}, Champion)`).replace('_er', eventName)
            }))
        }
    }
    else if (type == 'Souvenir Package') result = items.map(item => { return templates['Souvenir Package'].replace('_ir', item).replace('_er', eventName) })
    else if (type == 'Patch') result = items.map(item => { return templates.Patch.replace('_ir', !variant || variant == 'Paper' ? item : `${item} (${variant})`) + (event.type == 'tournament' ? ` | ${eventName}` : '') })
    else if (type == 'Charm') result = items.map(item => { return templates.Charm.replace('_ir', item) })

    return result
}