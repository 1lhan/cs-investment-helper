const jwt = require('jsonwebtoken')
const userModel = require('./models/userModel')
const Big = require('big.js')
const { events } = require('./events')
const { default: puppeteer } = require('puppeteer')

const big = (value) => new Big(value)

const authenticateToken = (req, res, next) => {
    const token = req.body.token.slice(6, req.body.token.length)
    if (!token) return res.json({ success: false, msg: 'Access denied. No token provided.' })

    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) return res.json({ success: false, msg: 'Invalid token.' })
        req.user = decoded
        next()
    })
}

const generateTags = (itemName) => {
    const variants = ['Paper', 'Glitter', 'Holo', 'Foil', 'Gold', 'Lenticular']
    const tournamentNames = ['Shanghai 2024', 'Copenhagen 2024', 'Paris 2023', 'Rio 2022', 'Antwerp 2022', 'Stockholm 2021', '2020 RMR']

    let tags = []
    const splittedItemName = itemName.includes('|') && itemName.split(' | ')

    if (itemName.includes('Charm')) tags.push('Charm')
    else if (itemName.slice(-3) == 'Pin') tags.push('Collectible')
    else if (itemName.includes('Souvenir Package')) tags.push('Souvenir Package')
    else if (['Capsule', 'Legends', 'Challengers', 'Contenders'].some(keyword => itemName.includes(keyword))) tags.push('Capsule')
    else if (itemName.includes('Pass')) tags.push('Pass')
    else if (itemName.slice(0, 5) == 'Patch') {
        tags.push('Patch')
        if (variants.some(variant => itemName.includes(variant))) tags.push(splittedItemName[1].split('(')[1].slice(0, -1))
    }
    else if (itemName.slice(0, 7) == 'Sticker') {
        tags.push('Sticker')
        if (variants.some(variant => itemName.includes(variant))) tags.push(splittedItemName[1].split('(')[1].slice(0, -1))
        else tags.push('Paper')
    }

    const operationEvents = events.filter(event => event.type == 'operation').map(event => { return { name: event.name, items: Object.values(event.items).flat() } })
    const foundedEvent = operationEvents.find(event => event.items.includes(splittedItemName[1] || itemName))
    if (foundedEvent) tags.push(foundedEvent.name)

    tournamentNames.forEach(tournamentName => { if (itemName.includes(tournamentName)) tags.push(tournamentName) })

    return tags
}

const getItemMarketPrice = async (itemName) => {
    try {
        const response = await fetch('http://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=' + itemName)
        const contentType = response.headers.get('content-type');

        if (!contentType || !contentType.includes('application/json')) { console.log(response); throw new Error('Invalid response format, expected JSON.') }

        const data = await response.json()

        if (!response.ok) {
            const errorMessages = {
                400: 'Invalid cookie.',
                500: `The item name is incorrect or the item has no listings. (item name: ${itemName})`,
                429: 'Too many requests.',
            }

            return { success: false, msg: errorMessages[response.status] || 'An error occurred while fetching item price.' }
        }
        if (!data.lowest_price && !data.median_price) return res.json({ success: false, msg: 'The item has not been sold in the last 24 hours.' })

        return { success: true, price: +(data.lowest_price || data.median_price).slice(1).replaceAll(',', '') }
    }
    catch (error) {
        console.log((error.message || 'An error occurred while fetching item price.') + ' (getItemMarketPrice())')
        return { success: false, msg: 'An error occurred while fetching item price.' }
    }
}

const getUser = async (userId) => {
    try {
        const user = await userModel.findById(userId).select('-password')
        if (!user) return { success: false, msg: 'User could not be found.' }
        return { success: true, user }
    }
    catch (error) {
        console.error((error.message || 'An error occurred while fetching user data.') + ` (userId: ${userId}, getUser())`)
        return { success: false, msg: 'An error occurred while fetching user data.' }
    }
}

const steamFeeCalculator = (price) => {
    const baseFee = 0.8698
    let fee;

    if (price <= 0.21) fee = 0.02
    else if (price <= 0.32) fee = 0.03
    else if (price <= 0.43) fee = 0.04
    else if (price == 0.44) fee = 0.05
    else if (price <= 0.55) fee = 0.06
    else if (price <= 0.66) fee = 0.07
    else if (price <= 0.72) fee = 0.08
    else if (price <= 0.78) fee = 0.09
    else if (price <= 0.89) fee = 0.1
    else if (price == 0.90) fee = 0.11
    else if (price <= 1.01) fee = 0.12
    else if (price <= 1.12) fee = 0.13
    else if (price == 1.13) fee = 0.14
    else if (price <= 1.24) fee = 0.15
    else if (price <= 1.35) fee = 0.16
    else if (price == 1.36) fee = 0.17
    else if (price <= 1.47) fee = 0.18
    else if (price <= 1.58) fee = 0.19
    else if (price == 1.59) fee = 0.2
    else if (price <= 1.70) fee = 0.21
    else if (price <= 1.81) fee = 0.22
    else if (price == 1.82) fee = 0.23
    else if (price <= 1.93) fee = 0.24
    else if (price <= 2.04) fee = 0.25
    else if (price == 2.05) fee = 0.26
    else if (price <= 2.16) fee = 0.27
    else if (price <= 2.27) fee = 0.28
    else if (price == 2.28) fee = 0.29
    else if (price <= 2.39) fee = 0.3
    else if (price <= 2.50) fee = 0.31
    else if (price == 2.51) fee = 0.32
    else if (price <= 2.62) fee = 0.33
    else if (price <= 2.73) fee = 0.34
    else if (price == 2.74) fee = 0.35
    else if (price <= 2.85) fee = 0.36

    if (price <= 2.85) return +new Big(price).minus(fee)
    return +new Big(price).times(baseFee).toFixed(2)
}

const calculateDateWithTimezoneOffset = (date, timezoneOffset) => {
    let _date = new Date(new Date().setUTCHours(0, 0, 0, 0))
    timezoneOffset >= 0
        ? _date.setHours(_date.getHours() + (timezoneOffset / 60))
        : _date.setHours(_date.getHours() - ((timezoneOffset * -1) / 60))
    return date && date !== '' ? new Date(date) : _date
}

const getItemPriceHistory = async (itemName, startDate) => {
    let retries = 0
    let isProcessDone = false
    let data;

    while (!isProcessDone) {
        try {
            const response = await fetch(`https://steamcommunity.com/market/pricehistory/?appid=730&currency=1&format=json&market_hash_name=${itemName}`, { headers: { 'Cookie': `steamLoginSecure=${process.env.STEAM};` } })
            data = await response.json()

            if (!response.ok) {
                const errorMessages = {
                    400: 'Invalid cookie.',
                    500: `The item name is incorrect or the item has no listings. (item name: ${itemName})`
                }

                if (response.status == 429) {
                    if (retries == 4) { isProcessDone = true; return { success: false, msg: 'Too many request.' } }
                    else {
                        retries++
                        await new Promise(resolve => setTimeout(resolve, 1000 * 60));
                        continue;
                    }
                }

                isProcessDone = true
                console.error(`Fetch error details: status: ${response.status}, item name: ${itemName}, start date: ${startDate}, (getItemPriceHistory())`)
                return { success: false, msg: errorMessages[response.status] || 'An error occurred while fetching item price history.' }
            }
        }
        catch (error) {
            isProcessDone = true
            console.log((error.message || 'An error occurred while fetching item price history.') + ' (getItemPriceHistory())')
            return { success: false, msg: 'An error occurred while fetching item price history.' }
        }

        let priceHistory = [] // price history item structure: ['4 Dec 2024', 1.011, 150] => [date, price, volume]

        for (let i = 0; i > -1; i++) {
            let _date = new Date(new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)).getTime() + (1000 * 60 * 60 * 24 * i))
            priceHistory.push([_date.toDateString().slice(4), 0, 0])

            if (_date.toDateString() == new Date(new Date(new Date().toUTCString()).setUTCHours(0, 0, 0, 0)).toDateString()) { break }
        }

        for (let i in data.prices) {
            let pricesItem = data.prices[i]
            let index = priceHistory.findIndex(item => item[0] == pricesItem[0].slice(0, 11))

            priceHistory[index][1] += +big(pricesItem[1]).times(pricesItem[2])
            priceHistory[index][2] += +big(pricesItem[2])
        }

        isProcessDone = true
        return { success: true, priceHistory: priceHistory.map(item => { return [item[0], item[2] != 0 ? +big(item[1]).div(item[2]).toFixed(3) : 0, item[2]] }) }
    }
}

const formatItemNames = (event, type, variant) => {
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

const urlHandler = (eventName, variant) => {
    const tournamentIdsByName = { 'Shanghai 2024': 23, 'Copenhagen 2024': 22, 'Paris 2023': 21, 'Rio 2022': 20 }
    const rarity = variant == 'Glitter' ? 'Mythical' : 'Legendary'

    return url = `https://steamcommunity.com/market/search?q=&category_730_Tournament%5B%5D=tag_Tournament${tournamentIdsByName[eventName]}&&category_730_Rarity%5B%5D=tag_Rarity_${rarity}&
        category_730_StickerCategory%5B%5D=tag_TeamLogo&category_730_StickerCategory%5B%5D=tag_Tournament&appid=730#p`
}

const getStockData = async (_url) => {
    const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1920, height: 1080, } })

    let pageNumber = 1
    let retries = 0
    let isProcessDone = false
    let result = { success: true, data: [] }

    while (!isProcessDone) {
        const page = await browser.newPage()
        let url = `${_url}${pageNumber}_name_asc`

        await page.goto(url, { waitUntil: 'networkidle2' })
        await new Promise(resolve => setTimeout(resolve, 1000 * 2.5))
        //await page.screenshot({ path: `screenshot${pageNumber}.png` })

        const dataScraping = await page.evaluate(() => {
            if (document.querySelector('.error_ctn') != null) { return { success: false, msg: document.querySelector('.error_ctn h3').innerText } }
            else if (document.querySelector('.market_listing_table_message') != null) { return { success: false, msg: document.querySelector('.market_listing_table_message').innerText } }
            else if (!document.querySelector('.market_listing_table_header')) { return { success: false, msg: 'Market listing table header not loaded' } }

            let items = document.querySelectorAll('.market_listing_row_link')
            let searchResultsTotal = document.querySelector('#searchResults_total').innerText
            let searchResultEnd = document.querySelector('#searchResults_end').innerText

            return {
                success: true, searchResultsTotal, searchResultEnd,
                data: Array.from(items).map(item => {
                    return {
                        name: item.querySelector('.market_listing_row').getAttribute('data-hash-name'),
                        stock: +item.querySelector('.market_listing_num_listings_qty').getAttribute('data-qty'),
                        //price: +item.querySelectorAll('.normal_price')[1].innerText.split(' ')[0].slice(1)
                    }
                })
            }
        })

        await page.close()

        if (dataScraping.success) {
            retries = 0
            result.data = result.data.concat(dataScraping.data)

            if (dataScraping.searchResultsTotal == dataScraping.searchResultEnd) isProcessDone = true
            else pageNumber = pageNumber + 1
        }
        else {
            retries = retries + 1
            if (retries == 10) { isProcessDone = true; result = { ...result, success: false, msg: 'Retries has exceed 10' } }
            if (dataScraping.msg == 'Yakın zamanda birden fazla talepte bulundunuz. Lütfen bekleyin ve talebinizi daha sonra tekrar yineleyin.') await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 2))
        }
    }
    await browser.close()
    return result
}

module.exports = { big, authenticateToken, generateTags, getItemMarketPrice, getUser, calculateDateWithTimezoneOffset, steamFeeCalculator, getItemPriceHistory, formatItemNames, urlHandler, getStockData }