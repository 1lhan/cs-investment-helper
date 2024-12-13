const express = require('express')
const router = express.Router()
const eventItemModel = require('../models/eventItemModel')
const stickerApplicationNumbers = require('../models/stickerApplicationNumbers')
const { events } = require('../events')
const puppeteer = require('puppeteer')
const { authenticateToken } = require('./utils')

const getStockData = async (_url) => {
    const browser = await puppeteer.launch({ headless: true/*, defaultViewport: { width: 1920, height: 1080, }*/ })

    let pageNumber = 1
    let retries = 0
    let isProcessDone = false
    let result = { success: true, data: [] }

    while (!isProcessDone) {
        const page = await browser.newPage()
        let url = `${_url}${pageNumber}_name_asc`

        await page.goto(url, { waitUntil: 'networkidle2' })
        await new Promise(resolve => setTimeout(resolve, 1000 * 2.5))
        await page.screenshot({ path: `screenshot${pageNumber}.png` })

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

const itemNameConverter = (arr, itemType, eventName, variant) => {
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

const urlHandler = (eventName, variant) => {
    const tournamentId = eventName == 'Shanghai 2024' ? 23 : eventName == 'Copenhagen 2024' ? 22 : eventName == 'Paris 2023' ? 21 : eventName == 'Rio 2022' ? 20 : ''
    const rarity = variant == 'Glitter' ? 'Mythical' : 'Legendary'

    return url = `https://steamcommunity.com/market/search?q=&category_730_Tournament%5B%5D=tag_Tournament${tournamentId}&&category_730_Rarity%5B%5D=tag_Rarity_${rarity}&
        category_730_StickerCategory%5B%5D=tag_TeamLogo&category_730_StickerCategory%5B%5D=tag_Tournament&appid=730#p`
}

const getItemPriceHistory = async (itemName, releaseDate) => {
    let isProcessDone = false
    let retries = 0

    while (!isProcessDone) {
        try {
            const response = await fetch(`https://steamcommunity.com/market/pricehistory/?appid=730&currency=1&format=json&market_hash_name=${itemName}`, { headers: { 'Cookie': `steamLoginSecure=${process.env.STEAM};` } })
            const data = await response.json()

            if (!response.ok) {
                console.error('Fetch error details (getItemPriceHistory()): ', { status: response.status, itemName, releaseDate })

                if (response.status == 400) { isProcessDone = true; return { success: false, msg: 'Invalid cookie.' } }
                else if (response.status == 500) { isProcessDone = true; return { success: false, msg: `The item name is incorrect or the item has no listings. (${itemName})` } }
                else if (response.status == 429) {
                    if (retries == 4) { isProcessDone = true; return { success: false, msg: 'Too many request.' } } // If 5 attempts are made for an item and it still returns null, the function will terminate and return an error.
                    else {
                        retries++
                        await new Promise(resolve => setTimeout(resolve, 1000 * 15));
                        continue;
                    }
                }
            }

            let priceHistory = [] // price history item structure: ['4 Dec 2024', 1.011, 150] => [date, price, volume]

            for (let i = 0; i > -1; i++) {
                let _date = new Date(new Date(new Date(releaseDate).setUTCHours(0, 0, 0, 0)).getTime() + (1000 * 60 * 60 * 24 * i))
                priceHistory.push([_date.toDateString().slice(4), 0, 0])

                if (_date.toDateString() == new Date(new Date(new Date().toUTCString()).setUTCHours(0, 0, 0, 0)).toDateString()) { break }
            }

            for (let i in data.prices) {
                let pricesItem = data.prices[i]
                let index = priceHistory.findIndex(item => item[0] == pricesItem[0].slice(0, 11))

                priceHistory[index][1] += pricesItem[1] * +pricesItem[2]
                priceHistory[index][2] += +pricesItem[2]
            }

            isProcessDone = true
            return { success: true, priceHistory: priceHistory.map(item => { return [item[0], +((item[1] / item[2]).toFixed(3)), item[2]] }) }
        }
        catch (error) {
            isProcessDone = true
            console.log((error.message || 'An error occurred while fetching item price history.') + 'getItemPriceHistory()')
            return { success: false, msg: 'An error occurred while fetching item price history.' }
        }
    }
}

router.post('/update-event-item', authenticateToken, async (req, res) => {
    const { eventName, type, variant } = req.body

    let event = events.find(item => item.name == eventName)

    let items = ['capsule', 'patchPackage', 'agent', 'case'].includes(type) ? event.items[type] : itemNameConverter(event.items[type], type, eventName, variant)
    items = items.map(item => { return { name: item, priceHistory: [] } })

    for (let i in items) {
        let priceHistory = await getItemPriceHistory(items[i].name, event.releaseDate)
        if (!priceHistory.success) return res.json({ success: false, msg: priceHistory.msg })

        items[i].priceHistory = priceHistory.priceHistory
    }

    try {
        await eventItemModel.findOneAndUpdate(
            { eventName, type, ...(variant && { variant }) },
            { eventName, type, ...(variant && { variant }), items },
            { upsert: true, new: true }
        )

        return res.json({ success: true })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while updating the event item.') + ' (/update-event-item)')
        return res.json({ success: false, msg: 'An error occurred while updating the event item.' });
    }
})

router.post('/update-sticker-application-numbers', authenticateToken, async (req, res) => {
    const { eventName, variant, formValues } = req.body

    const event = events.find(event => event.name == eventName)

    let stickerMetrics;
    try { stickerMetrics = await stickerApplicationNumbers.findOne({ eventName, variant }) }
    catch (error) {
        console.error((error.message || 'An error occurred while fetching sticker application numbers.') + ' (/update-sticker-application-numbers)')
        return res.json({ success: false, msg: 'An error occurred while fetching sticker application numbers.' })
    }

    if (stickerMetrics == null) {
        try {
            stickerMetrics = await new stickerApplicationNumbers({
                eventName, variant, dates: [new Date()],
                stickers: Object.keys(formValues).map(stickerName => { return { name: stickerName, data: [[formValues[stickerName], null, null]] } })
            }).save()
        }
        catch (error) {
            console.error((error.message || 'An error occurred while creating new sticker application numbers.') + ' (/update-sticker-application-numbers)')
            return res.json({ success: false, msg: 'An error occurred while creating new sticker application numbers.' })
        }
    }
    else if ((new Date() - new Date(stickerMetrics.dates[stickerMetrics.dates.length - 1])) / (1000 * 60 * 60 * 24) > 27) {
        stickerMetrics.dates.push(new Date())
        Object.keys(formValues).forEach(stickerName => { stickerMetrics.stickers.find(item => item.name == stickerName).data.push([formValues[stickerName], null, null]) })

        try { stickerMetrics = await stickerMetrics.save() }
        catch (error) {
            console.error((error.message || 'An error occurred while saving sticker application numbers.') + ' (/update-sticker-application-numbers)')
            return res.json({ success: false, msg: 'An error occurred while saving sticker application numbers.' })
        }
    }
    else if (!(stickerMetrics.stickers[0].data[stickerMetrics.dates.length - 1][1] == null || stickerMetrics.stickers[0].data[stickerMetrics.dates.length - 1][2] == null)) {
        return res.json({ success: false, msg: 'New data cannot be added yet; the required date has not arrived. And all the data fields in the last array of the data in the stickers are already filled.' })
    }

    const stickerDataIndex = stickerMetrics.dates.length - 1

    let stockDatas = await getStockData(urlHandler(eventName, variant))
    if (!stockDatas.success) return res.json({ success: false, msg: 'An error occurred while fetching items stock data.' })

    for (let i in stickerMetrics.stickers) {
        const stickerName = stickerMetrics.stickers[i].name

        console.log(`${+i + 1} / ${stickerMetrics.stickers.length}`)

        let itemPriceHistory = await getItemPriceHistory(stickerName, event.releaseDate)
        if (!itemPriceHistory.success) return res.json({ success: false, msg: itemPriceHistory.msg })

        const last2DaysOfPriceHistory = itemPriceHistory.priceHistory.filter(item => item[2] != 0).reverse().slice(0, 2)
        const price = +(last2DaysOfPriceHistory.reduce((t, c) => t + (c[1] * c[2]), 0) / last2DaysOfPriceHistory.reduce((t, c) => t + c[2], 0)).toFixed(3)
        const stock = stockDatas.data.find(item => item.name == stickerName).stock

        stickerMetrics.stickers[i].data[stickerDataIndex][1] = price
        stickerMetrics.stickers[i].data[stickerDataIndex][2] = stock
    }

    try {
        await stickerMetrics.save()
        return res.json({ success: true })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while saving sticker application data.') + ' (/update-sticker-application-numbers)')
        return res.json({ success: false, msg: 'An error occurred while saving sticker application data.' })
    }
})

module.exports = router