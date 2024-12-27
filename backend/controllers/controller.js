const express = require('express')
const router = express.Router()
const Big = require('big.js')
const { authenticateToken, generateTags, getItemMarketPrice, getUser, steamFeeCalculator, formatItemNames, getItemPriceHistory, big, getStockData, urlHandler } = require('../utils')
const { events } = require('../events')
const userModel = require('../models/userModel')
const eventItemModel = require('../models/eventItemModel')
const stickerApplicationNumbers = require('../models/stickerApplicationNumbers')

router.post('/add-investment', authenticateToken, async (req, res) => {
    const { userId, items } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    let i = 0;

    const getItemsMarketPriceAndSet = new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            const item = items[i]
            const name = item.name

            const itemMarketPrice = await getItemMarketPrice(name)
            if (!itemMarketPrice.success) { clearInterval(interval); reject(new Error(itemMarketPrice.msg)) }

            const itemIndex = user.investments.findIndex(item => item.name == name)

            let date = item.date && item.date != '' ? new Date(item.date) : new Date()

            if (itemIndex == -1) {
                user.investments.push({
                    name,
                    initialPurchaseDate: date,
                    avgCost: item.avgCost,
                    quantity: item.quantity,
                    currentTotalCost: big(item.avgCost).times(item.quantity),
                    totalCost: big(item.avgCost).times(item.quantity),
                    marketPrice: itemMarketPrice.price,
                    lastUpdate: null,
                    tags: generateTags(name)
                })
            }
            else {
                const existingItem = user.investments[itemIndex]

                user.investments[itemIndex].avgCost = big(big(existingItem.avgCost).times(existingItem.quantity).plus(big(item.avgCost).times(item.quantity))).div(big(existingItem.quantity).plus(item.quantity))
                user.investments[itemIndex].quantity = big(existingItem.quantity).plus(item.quantity)
                user.investments[itemIndex].currentTotalCost = big(existingItem.currentTotalCost).plus(item.currentTotalCost || new Big(item.avgCost).times(item.quantity))
                user.investments[itemIndex].totalCost = big(existingItem.totalCost).plus(item.totalCost || new Big(item.avgCost).times(item.quantity))
                user.investments[itemIndex].marketPrice = itemMarketPrice.price
                user.investments[itemIndex].lastUpdate = { date, avgCost: item.avgCost, quantity: item.quantity }
            }

            if (i == items.length - 1) { clearInterval(interval); resolve() }
            else i++
        }, 3200)
    })

    try { await getItemsMarketPriceAndSet }
    catch (error) {
        console.error((error.message || 'Error.') + ' (/add-investment, getItemsMarketPriceAndSet)')
        return res.json({ success: false, msg: error.message || 'An error occurred while processing investment items.' })
    }

    try {
        const save = await user.save()
        return res.json({ success: true, user: save })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while processing investment items.') + ' (/add-investment)')
        return res.json({ success: false, msg: 'An error occurred while processing investment items.' })
    }
})

router.post('/delete-investment-item', authenticateToken, async (req, res) => {
    const { itemId, userId } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    if (!user.investments.find(item => item._id == itemId)) return res.json({ success: false, msg: 'Investment item could not be found.' })

    try {
        const updatedUser = await userModel.findOneAndUpdate(
            { _id: userId },
            { $pull: { investments: { _id: itemId } } },
            { new: true }
        )

        return res.json({ success: !!updatedUser, user: updatedUser })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while deleting the investment item.') + ' (/delete-investment-item)')
        return res.json({ success: false, msg: 'An error occurred while deleting the investment item.' })
    }
})

router.post('/save-transaction', authenticateToken, async (req, res) => {
    const { itemId, userId, price, quantity, date, transactionType } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    const itemIndex = user.investments.findIndex(item => item._id == itemId)
    if (itemIndex == -1) return res.json({ success: false, msg: 'Investment item could not be found.' })
    const item = user.investments[itemIndex]

    const _date = date && date != '' ? new Date(date) : new Date()

    if (transactionType == 'purchase') {
        const totalCostOfTransaction = big(price).times(quantity)
        const newCurrentTotalCost = big(item.currentTotalCost).plus(totalCostOfTransaction)
        const newQuantity = big(item.quantity).plus(quantity)

        Object.assign(user.investments[itemIndex], {
            avgCost: big(newCurrentTotalCost).div(newQuantity),
            quantity: newQuantity,
            currentTotalCost: newCurrentTotalCost,
            totalCost: big(item.totalCost).plus(totalCostOfTransaction),
            lastUpdate: { date: _date, avgCost: price, quantity }
        })
    }
    else {
        if (quantity > item.quantity) return res.json({ success: false, msg: 'The quantity of the item to be sold cannot exceed the current quantity available.' })

        const totalSalesOfTransaction = big(price).times(quantity)
        const newTotalSales = big(item.totalSales || 0).plus(totalSalesOfTransaction)
        const newSoldQuantity = big(item.soldQuantity || 0).plus(quantity)
        const profitOfTransaction = big(big(price).minus(item.avgCost)).times(quantity)

        Object.assign(user.investments[itemIndex], {
            quantity: big(item.quantity).minus(quantity),
            currentTotalCost: big(item.currentTotalCost).minus(big(item.avgCost).times(quantity)),
            avgSalePrice: big(newTotalSales).div(newSoldQuantity),
            soldQuantity: newSoldQuantity,
            totalSales: newTotalSales,
            salesProfit: big(item.salesProfit || 0).plus(profitOfTransaction),
            netSalesProfit: big(big(steamFeeCalculator(price)).minus(item.avgCost)).times(quantity),
            lastUpdate: { date: _date, avgSalePrice: price, soldQuantity: quantity }
        })
    }

    try {
        const save = await user.save()
        return res.json({ success: !!save, user: save })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while saving the transaction.') + ' (/save-transaction)')
        return res.json({ success: false, msg: 'An error occurred while saving the transaction.' })
    }
})

router.post('/undo-last-update', authenticateToken, async (req, res) => {
    const { itemId, userId } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    const itemIndex = user.investments.findIndex(item => item._id == itemId)
    if (itemIndex == -1) return res.json({ success: false, msg: 'Investment item could not be found.' })

    const itemLastUpdate = user.investments[itemIndex].lastUpdate
    if (!itemLastUpdate) return res.json({ success: false, msg: 'The investment item has no last update data.' })

    const item = user.investments[itemIndex]
    const lastUpdate = item.lastUpdate

    if (lastUpdate.avgCost) {
        const totalCostOfLastUpdate = big(lastUpdate.avgCost).times(lastUpdate.quantity)
        const newQuantity = big(item.quantity).minus(lastUpdate.quantity)
        const newCurrentTotalCost = big(item.currentTotalCost).minus(totalCostOfLastUpdate)

        Object.assign(user.investments[itemIndex], {
            avgCost: big(newCurrentTotalCost).div(newQuantity),
            quantity: newQuantity,
            currentTotalCost: newCurrentTotalCost,
            totalCost: big(item.totalCost).minus(totalCostOfLastUpdate)
        })
    }
    else {
        const totalSalesOfLastUpdate = big(lastUpdate.avgSalePrice).times(lastUpdate.soldQuantity)
        const newSoldQuantity = big(item.soldQuantity).minus(lastUpdate.soldQuantity)
        const newTotalSales = big(item.totalSales).minus(totalSalesOfLastUpdate)

        Object.assign(user.investments[itemIndex], {
            quantity: big(item.quantity).plus(lastUpdate.soldQuantity),
            currentTotalCost: big(item.currentTotalCost).plus(big(item.avgCost).times(lastUpdate.soldQuantity)),
            avgSalePrice: newSoldQuantity == 0 ? 0 : big(newTotalSales).div(newSoldQuantity),
            soldQuantity: newSoldQuantity == 0 ? 0 : newSoldQuantity,
            totalSales: newSoldQuantity == 0 ? 0 : newTotalSales,
            salesProfit: big(item.salesProfit).minus(big(big(lastUpdate.avgSalePrice).minus(item.avgCost)).times(lastUpdate.soldQuantity)),
            netSalesProfit: big(item.netSalesProfit).minus(big(steamFeeCalculator(lastUpdate.avgSalePrice)).minus(item.avgCost).times(lastUpdate.soldQuantity))
        })
    }

    user.investments[itemIndex].lastUpdate = null

    try {
        const save = await user.save()
        return res.json({ success: !!save, user: save })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while saving user.') + ' (/undo-last-update)')
        return res.json({ success: false, msg: 'An error occurred while processing undo last update.' })
    }
})

router.post('/update-investment-market-prices', authenticateToken, async (req, res) => {
    const { userId, date } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    const lastUpdateDateCheck = new Date() - new Date(user.investmentsMarketPriceUpdateStatus.lastUpdateDate) > (1000 * 60 * 30)
    const updateStartDateCheck = new Date() - new Date(user.investmentsMarketPriceUpdateStatus.updateStartDate) > (3200 * user.investments.length) + (1000 * 10)
    const isUpdating = user.investmentsMarketPriceUpdateStatus.isUpdating

    const investments = user.investments.filter(item => item.quantity > 0)

    if (!(lastUpdateDateCheck && (!isUpdating || (isUpdating && updateStartDateCheck)))) return res.json({ success: false, msg: 'Investments market price can be updated every 30 minutes.' })
    if (investments.length == 0) return res.json({ success: false, msg: 'User has no investments.' })

    try {
        user.investmentsMarketPriceUpdateStatus.isUpdating = true
        user.investmentsMarketPriceUpdateStatus.updateStartDate = new Date()

        const save = await user.save()
        user = save
    }
    catch (error) {
        console.error((error.message || 'An error occurred while saving user.') + ' (1.user save, /update-investment-market-prices)')
        return res.json({ success: false, msg: 'An error occurred while updating the investment market prices.' })
    }

    let itemIndex = 0

    const updateInvestmentMarketPrices = new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            const item = investments[itemIndex]

            console.log(`${itemIndex + 1} / ${investments.length}`)

            const itemMarketPrice = await getItemMarketPrice(item.name)
            if (!itemMarketPrice.success) { clearInterval(interval); return reject(new Error(itemMarketPrice.msg)) }

            user.investments.find(_item => _item._id == item._id).marketPrice = itemMarketPrice.price

            if (itemIndex == investments.length - 1) { clearInterval(interval); return resolve() }
            itemIndex++
        }, 3200)
    })

    try { await updateInvestmentMarketPrices }
    catch (error) {
        console.error((error.message || 'Error.') + ' (updateInvestmentMarketPrices, /update-investment-market-prices)')
        return res.json({ success: false, msg: 'An error occurred while updating the investment market prices.' })
    }

    const totalCost = +investments.reduce((t, c) => big(t).plus(big(c.avgCost).times(c.quantity)), 0).toFixed(2)
    const totalMarketValue = +investments.reduce((t, c) => big(t).plus(big(c.marketPrice).times(c.quantity)), 0).toFixed(2)
    const lastItem = user.investmentValuationHistory[user.investmentValuationHistory.length - 1] // last investment valuation history item
    const lastIndex = user.investmentValuationHistory.length - 1 // index of last investment valuation history item

    if (lastItem == undefined) user.investmentValuationHistory.push([date, totalCost, totalMarketValue, 1])
    else {
        if (new Set([...lastItem[0].split('.'), ...date.split('.')]).size > 3) {
            user.investmentValuationHistory[lastIndex] = lastItem.slice(0, 3)
            user.investmentValuationHistory.push([date, totalCost, totalMarketValue, 1])
        }
        else {
            if (lastItem[1] != totalCost) user.investmentValuationHistory[lastIndex] = [date, totalCost, totalMarketValue, 1]
            else {
                const counter = lastItem[3]

                user.investmentValuationHistory[lastIndex] = [
                    date,
                    +big(big(lastItem[1]).times(counter).plus(totalCost)).div(counter + 1).toFixed(2),
                    +big(big(lastItem[2]).times(counter).plus(totalMarketValue)).div(counter + 1).toFixed(2),
                    counter + 1
                ]
            }
        }
    }

    try {
        user.investmentsMarketPriceUpdateStatus.isUpdating = false
        user.investmentsMarketPriceUpdateStatus.lastUpdateDate = new Date()

        const save = await user.save();
        if (save) return res.json({ success: true, user })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while saving the user.') + ' (2. user save, /update-investment-market-prices)')
        return res.json({ success: false, msg: 'An error occurred while updating the investment market prices.' });
    }
})

router.get('/get-event-items/:eventName/:type/:variant', async (req, res) => {
    const { eventName, type, variant } = req.params

    try {
        const query = {
            ...(eventName != 'Any' && { eventName }),
            ...(type != 'Any' && { type: { $in: type.includes(',') ? type.split(',') : [type] } }),
            ...(variant != 'Any' && { variant }),
        }

        const data = await eventItemModel.find(query)
        return res.json({ success: !!data.length && !data[0].items.length == 0, data: data || [], ...((data.length == 0 || data[0].items.length == 0) && { msg: 'No items found.' }) })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while fetching event items.') + ' (/get-event-items)')
        return res.json({ success: false, message: 'An error occurred while fetching event items.' })
    }
})

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

router.get('/get-sticker-application-numbers/:eventName/:variant', async (req, res) => {
    const { eventName, variant } = req.params

    try {
        const data = await stickerApplicationNumbers.findOne({ eventName, variant })
        return res.json({ success: !!data, data, ...(data == null && { msg: 'No data found.' }) })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while fetching sticker application numbers.') + ' (/get-sticker-application-numbers)')
        return res.json({ success: false, msg: 'An error occurred while fetching sticker application numbers.' })
    }
})

router.post('/update-user-informations', authenticateToken, async (req, res) => {
    const { userId, username, email } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)

    try {
        const update = await userModel.findOneAndUpdate({ _id: userId }, { username, email }, { new: true })
        if (!update) return res.json({ success: false, msg: 'Failed to update user information.' })
        return res.json({ success: true, user: update })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while updating user informations.') + ` (/update-user-informations, userId: ${userId})`)
        return res.json({ success: false, msg: 'An error occurred while updating user informations' })
    }
})

router.post('/delete-account', authenticateToken, async (req, res) => {
    const { userId } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
        
    if (user.user.accountType == 'admin') return res.json({ success: false, msg: 'You cannot delete an admin account.' })

    try {
        const _delete = await userModel.findByIdAndDelete(userId)
        if (!_delete) return res.json({ success: false, msg: 'Failed to delete the account.' })
        return res.json({ success: true })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while deleting the account.') + ` (/delete-account, userId: ${userId})`)
        return res.json({ success: false, msg: 'An error occurred while deleting the account' })
    }
})

module.exports = router