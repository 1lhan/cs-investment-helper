import { events } from "./events"

export const usePostRequest = async (endpoint, requestBody) => {
    try {
        const response = await fetch(import.meta.env.VITE_REACT_APP_BACKEND_URL + endpoint, {
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

export const itemNameConverter = (arr, itemType, eventName, variant) => {
    let templates = {
        sticker: 'Sticker | _itemName | _eventName',
        souvenirPackage: '_eventName _itemName Souvenir Package',
        patch: 'Patch | _itemName',
        graffiti: 'Sealed Graffiti | _itemName',
        charm: 'Charm | _itemName'
    }

    const graffitiColors = [
        'Wire Blue', 'Desert Amber', 'SWAT Blue', 'Battle Green', 'Violent Violet', 'Tiger Orange', 'Princess Pink', 'Jungle Green', 'Frog Green', 'Dust Brown',
        'Monster Purple', 'Bazooka Pink', 'Monarch Blue', 'Blood Red', 'Cash Green', 'Brick Red', 'Tracer Yellow', 'Shark White', 'War Pig Pink'
    ]

    let event = events.find(event => event.name == eventName)
    let result = []

    if (itemType == 'sticker' || itemType == 'autograph') {
        result = arr.map(item => { return templates.sticker.replace('_itemName', !variant || variant == 'Paper' ? item : `${item} (${variant})`).replace(' | _eventName', event.type == 'tournament' ? ` | ${eventName}` : '') })

        if (eventName == 'Paris 2023' && itemType == 'autograph') result.push(variant == 'Paper' ? event.specificItems[itemType][0] : event.specificItems[itemType].find(item => item.includes(variant)))

        if (itemType == 'autograph' && event.championAutograph) {
            result = result.concat(event.championAutograph.map(item => {
                return templates.sticker.replace('_itemName', variant == 'Paper' ? `${item} (Champion)` : `${item} (${variant}, Champion)`).replace('_eventName', eventName)
            }))
        }
    }
    else if (itemType == 'souvenirPackage') result = arr.map(item => { return templates.souvenirPackage.replace('_itemName', item).replace('_eventName', eventName) })
    else if (itemType == 'patch') result = arr.map(item => { return templates.patch.replace('_itemName', !variant || variant == 'Paper' ? item : `${item} (${variant})`) + (event.type == 'tournament' ? ` | ${eventName}` : '') })
    else if (itemType == 'graffiti') result = arr.map(item => { return graffitiColors.map(color => { return `${templates.graffiti.replace('_itemName', item)} (${color})` }) }).flat()
    else if (itemType == 'charm') result = arr.map(item => { return templates.charm.replace('_itemName', item) })

    return result
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