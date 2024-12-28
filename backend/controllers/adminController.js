const express = require('express')
const router = express.Router()
const { authenticateToken, formatItemNames, getItemPriceHistory, big, getStockData, urlHandler } = require('../utils')
const { events } = require('../events')
const eventItemModel = require('../models/eventItemModel')
const stickerApplicationNumbers = require('../models/stickerApplicationNumbers')

router.post('/update-event-item', authenticateToken, async (req, res) => {
    const { eventName, type, variant } = req.body

    let event = events.find(item => item.name == eventName)
    let items = ['Capsule', 'Patch Package', 'Agent', 'Case'].includes(type) ? event.items[type] : formatItemNames(event, type, variant)
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
    let stickerMetrics

    try { stickerMetrics = await stickerApplicationNumbers.findOne({ eventName, variant }) }
    catch (error) {
        console.error((error.message || 'An error occurred while fetching sticker application numbers.') + ' (/update-sticker-application-numbers)')
        return res.json({ success: false, msg: 'An error occurred while fetching sticker application numbers.' })
    }

    try {
        if (stickerMetrics == null) {
            stickerMetrics = await new stickerApplicationNumbers({
                eventName, variant, dates: [new Date()],
                stickers: Object.keys(formValues).map(stickerName => { return { name: stickerName, data: [[formValues[stickerName], null, null]] } })
            }).save()
        }
        else if ((new Date() - new Date(stickerMetrics.dates[stickerMetrics.dates.length - 1])) / (1000 * 60 * 60 * 24) > 27) {
            stickerMetrics.dates.push(new Date())
            Object.keys(formValues).forEach(stickerName => { stickerMetrics.stickers.find(item => item.name == stickerName).data.push([formValues[stickerName], null, null]) })
            stickerMetrics = await stickerMetrics.save()
        }
        else if (!stickerMetrics.stickers.some(sticker => sticker.data[sticker.data.length - 1].some(value => value == null))) {
            return res.json({ success: false, msg: "New data cannot be added yet because the required date has not arrived, and all the data fields in the last array of the stickers' data are already filled." })
        }
    }
    catch (error) {
        console.error((error.message || 'An error occurred while creating new sticker application numbers.') + ' (/update-sticker-application-numbers)')
        return res.json({ success: false, msg: 'An error occurred while creating new sticker application numbers.' })
    }

    const index = stickerMetrics.dates.length - 1

    const stockData = await getStockData(urlHandler(eventName, variant))
    if (!stockData.success) return res.json({ success: false, msg: stockData.msg || 'An error occurred while fetching items stock data.' })

    for (let i in stickerMetrics.stickers) {
        const stickerName = stickerMetrics.stickers[i].name

        let itemPriceHistory = await getItemPriceHistory(stickerName, event.releaseDate)
        if (!itemPriceHistory.success) return res.json({ success: false, msg: itemPriceHistory.msg })

        const last2DaysOfPriceHistory = itemPriceHistory.priceHistory.filter(item => item[2] != 0).reverse().slice(0, 2)
        const price = +big(last2DaysOfPriceHistory.reduce((t, c) => +big(t).plus(+big(c[1]).times(c[2])), 0)).div(last2DaysOfPriceHistory.reduce((t, c) => +big(t).plus(c[2]), 0)).toFixed(3)
        const stock = stockData.data.find(item => item.name == stickerName).stock

        stickerMetrics.stickers[i].data[index][1] = price
        stickerMetrics.stickers[i].data[index][2] = stock
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