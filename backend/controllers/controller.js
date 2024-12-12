const express = require('express')
const router = express.Router()
const eventItemModel = require('../models/eventItemModel')
const stickerApplicationNumbers = require('../models/stickerApplicationNumbers')
const userModel = require('../models/userModel')

const tournamentNames = [
    'Copenhagen 2024', 'Paris 2023', 'Rio 2022', 'Antwerp 2022', 'Stockholm 2021', '2020 RMR', 'Berlin 2019', 'Katowice 2019', 'London 2018',
    'Boston 2018', 'Krakow 2017', 'Atlanta 2017', 'Cologne 2016', 'MLG Columbus 2016', 'Cluj-Napoca 2015', 'Katowice 2015', 'Katowice 2014'
]

const variants = ['Paper', 'Glitter', 'Holo', 'Foil', 'Gold', 'Lenticular']

const getItemMarketPrice = async (itemName) => {
    try {
        const response = await fetch('http://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=' + itemName)
        const data = await response.json()
        //
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.log(response)
            console.log(data)
            throw new Error('Invalid response format, expected JSON.')
        }

        if (!response.ok) {
            console.error('Fetch error details (getItemMarketPrice()): ', { status: response.status, itemName })

            if (response.status == 400) return { success: false, msg: 'Invalid cookie.' }
            else if (response.status == 500) return { success: false, msg: `The item name is incorrect or the item has no listings. (${itemName})` }
            else if (response.status == 429) return { success: false, msg: 'Too many request.' }
            else return { success: false, msg: 'An error occurred while fetching item price.' }
        }
        else return { success: true, price: +data.lowest_price.slice(1).replaceAll(',', '') }
    }
    catch (error) {
        console.log((error.message || 'An error occurred while fetching item price.') + 'getItemMarketPrice()')
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
        console.error((error.message || 'An error occurred while fetching user data.') + ' (getUser())')
        return { success: false, msg: 'An error occurred while fetching user data.' }
    }
}

const itemTagHandler = (itemName) => {
    let tags = []

    if (itemName.split('|')[0] == 'Sticker ') {
        let splittedName = itemName.split('|')

        tags.push('Sticker')

        // If item name includes '(', that is mean sticker is not paper and this condition push the variant of the sticker to tags
        if (splittedName[1].includes('(')) variants.forEach(variant => { if (splittedName[1].includes(variant)) tags.push(variant) })
        else tags.push('Paper')

        if (splittedName.length > 2) tags.push(splittedName[2].slice(1))
    }
    else if (['Capsule', 'Legends', 'Challengers', 'Contenders'].some(keyword => itemName.includes(keyword))) {
        tags.push('Capsule')
        tournamentNames.forEach(tournamentName => { if (itemName.includes(tournamentName)) tags.push(tournamentName) })
    }

    return tags
}

// Get Operations

router.get('/get-tournament-items/:eventName/:type/:variant', async (req, res) => {
    const { eventName, type, variant } = req.params

    try {
        const query = {
            ...(eventName !== 'Any' && { eventName }),
            ...(type !== 'Any' && { type: { $in: type.includes(',') ? type.split(',') : [type] } }),
            ...(variant !== 'Any' && { variant }),
        }

        const data = await eventItemModel.find(query)

        return res.json({ success: !!data.length, data: data || [], ...(data.length == 0 && { msg: 'No items found.' }) })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while fetching tournament items.') + ' (/get-tournament-items)')
        return res.json({ success: false, message: 'An error occurred while fetching tournament items.' })
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

// Investment Operations

router.post('/add-investment', async (req, res) => {
    const { userId, timezoneOffSet, items } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    let resultMsg = []
    let i = 0;

    const getItemsMarketPriceAndSet = new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            const name = items[i].name

            const itemMarketPrice = await getItemMarketPrice(name)
            if (!itemMarketPrice.success) { resultMsg.push(`${name} invalid item name.`); i++; return; }

            const itemIndex = user.investments.findIndex(item => item.name == name)
            let date = new Date(new Date().setUTCHours(0, 0, 0, 0))
            timezoneOffSet >= 0 ? date.setHours(date.getHours() + (timezoneOffSet / 60)) : date.setHours(date.getHours() - ((timezoneOffSet * -1) / 60))

            if (itemIndex == -1) user.investments.push({ ...items[i], marketPrice: itemMarketPrice.price, initialPurchaseDate: items[i].date ? new Date(items[i].date) : date, tags: itemTagHandler(name) })
            else {
                user.investments[itemIndex].totalCost += items[i].totalCost
                user.investments[itemIndex].quantity += +items[i].quantity
                user.investments[itemIndex].lastUpdate = { date: items[i].date ? new Date(items[i].date) : date, totalCost: items[i].totalCost, quantity: +items[i].quantity }
            }

            if (i == items.length - 1) { clearInterval(interval); resolve() }
            else i++
        }, 3200);
    })

    try { await getItemsMarketPriceAndSet }
    catch (error) {
        console.error((error.message || 'getItemsMarketPriceAndSet error.') + ' (/add-investment, getItemsMarketPriceAndSet)')
        return res.json({ success: false, msg: 'An error occurred while processing investment items.' })
    }

    try {
        if (resultMsg.length == items.length) return res.json({ success: false, msg: resultMsg })

        const save = await user.save()
        return res.json({ success: true, ...(resultMsg.length > 0 && { msg: resultMsg.length > 0 && [...resultMsg, 'Other investment items have been saved.'] }), user: save })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while processing investment items.') + ' (/add-investment)')
        return res.json({ success: false, msg: 'An error occurred while processing investment items.' })
    }
})

router.post('/save-transaction', async (req, res) => {
    const { userId, itemId, timezoneOffSet, price, quantity, date, transactionType } = req.body;

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    try {
        const item = user.investments.find(item => item._id == itemId)
        if (!item) return res.json({ success: false, msg: 'Investment item could not be found.' })

        let _date = new Date(new Date().setUTCHours(0, 0, 0, 0))
        timezoneOffSet >= 0 ? _date.setHours(_date.getHours() + (timezoneOffSet / 60)) : _date.setHours(_date.getHours() - ((timezoneOffSet * -1) / 60))

        if (transactionType == 'purchase') {
            item.totalCost += +price * +quantity
            item.quantity += +quantity
            item.lastUpdate = { date: date ? new Date(date) : _date, totalCost: +price * +quantity, quantity: +quantity }
        }
        else {
            item.totalSales += +price * +quantity
            item.soldQuantity += +quantity
            item.lastUpdate = { date: date ? new Date(date) : _date, totalSales: +price * +quantity, soldQuantity: +quantity }
        }

        const save = await user.save()
        return res.json({ success: true, user: save })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while saving the transaction.') + ' (/save-transaction)')
        return res.json({ success: false, msg: 'An error occurred while saving the transaction.' })
    }
})

router.post('/undo-last-update', async (req, res) => {
    const { userId, itemId } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    const investmentItemIndex = user.investments.findIndex(item => item._id == itemId)
    if (investmentItemIndex == -1) return res.json({ success: false, msg: 'Investment item does not exist.' })

    const investmentItemLastUpdateObj = user.investments[investmentItemIndex].lastUpdate
    if (!investmentItemLastUpdateObj) return res.json({ success: false, msg: 'The investment item has no last update data.' })

    const investmentItem = user.investments[investmentItemIndex]

    if (investmentItemLastUpdateObj.totalCost) {
        investmentItem.totalCost -= investmentItemLastUpdateObj.totalCost
        investmentItem.quantity -= investmentItemLastUpdateObj.quantity
    }
    else {
        investmentItem.totalSales -= investmentItemLastUpdateObj.totalSales
        investmentItem.soldQuantity -= investmentItemLastUpdateObj.soldQuantity
    }
    investmentItem.lastUpdate = null

    try {
        await user.save()
        return res.json({ success: true, user })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while saving user.') + ' (/undo-last-update)')
        return res.json({ success: false, msg: 'An error occurred while processing undo last update.' })
    }
})

router.post('/delete-investment-item', async (req, res) => {
    const { userId, itemId } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    if (!!user.investmentsMarketPriceUpdateStatus.isUpdating) {
        return res.json({ success: false, msg: 'Please wait for the ongoing market price updates of investment items to complete before attempting to delete an investment item.' })
    }

    const investmentItemIndex = user.investments.findIndex(item => item._id == itemId)
    if (investmentItemIndex == -1) return res.json({ success: false, msg: 'Investment item could not be found.' })

    try {
        const update = await userModel.findOneAndUpdate({ _id: userId }, { $pull: { investments: { _id: itemId } } }, { new: true })
        return res.json({ success: true, user: update })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while deleting the investment item.') + ' (/delete-investment-item)')
        return res.json({ success: false, msg: 'An error occurred while deleting the investment item.' })
    }
})

// Investment Market Price Update Operations

router.get('/permission-to-update-investments-market-price/:userId', async (req, res) => {
    let user = await getUser(req.params.userId)
    if (!user.success) return res.json(user)
    user = user.user

    const lastUpdateDateCheck = new Date() - new Date(user.investmentsMarketPriceUpdateStatus.lastUpdateDate) > (1000 * 60 * 30)
    const updateStartDateCheck = new Date() - new Date(user.investmentsMarketPriceUpdateStatus.updateStartDate) > (3200 * user.investments.length) + (1000 * 10)
    const isUpdating = user.investmentsMarketPriceUpdateStatus.isUpdating

    return res.json({ success: true, result: lastUpdateDateCheck && (!isUpdating || (isUpdating && updateStartDateCheck)) })
})

router.post('/update-investments-market-price', async (req, res) => {
    const { userId, date } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)
    user = user.user

    if (user.investments.length == 0) return res.json({ success: false, msg: 'User has no investments.' })

    user.investmentsMarketPriceUpdateStatus.isUpdating = true
    user.investmentsMarketPriceUpdateStatus.updateStartDate = new Date()

    try {
        const _save = await user.save()
        user = _save
    }
    catch (error) {
        console.error((error.message || 'Failed to update user status before starting the investments market price update process.') + ' (/update-investments-market-price)')
        return res.json({ success: false, msg: 'An error occurred while updating investments market price.' })
    }

    let itemIndex = 0;

    const updateItemsMarketPrices = new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            if (itemIndex == user.investments.length) {
                clearInterval(interval);
                resolve()
            }
            else {
                const itemMarketPrice = await getItemMarketPrice(user.investments[itemIndex].name)

                if (!itemMarketPrice.success) {
                    clearInterval(interval);
                    reject(new Error(itemMarketPrice.msg))
                }
                else {
                    console.log(`${itemIndex + 1}/${user.investments.length}`)

                    user.investments[itemIndex].marketPrice = itemMarketPrice.price
                    itemIndex++
                }
            }
        }, 3200)
    })

    try { await updateItemsMarketPrices }
    catch (error) {
        console.error((error.message || 'updateItemsMarketPrice error.') + ' (/update-investments-market-price, updateItemsMarketPrice)')
        return res.json({ success: false, msg: 'An error occurred while updating items market price.' });
    }

    try {
        const totalCost = +(user.investments.reduce((t, c) => t + c.totalCost, 0)).toFixed(2);
        const totalMarketValue = +(user.investments.reduce((t, c) => t + (c.marketPrice * c.quantity), 0)).toFixed(2);

        if (user.investmentValuationHistory.length == 0) user.investmentValuationHistory.push([date, totalCost, totalMarketValue, 1])
        else {
            const lastValuation = user.investmentValuationHistory[user.investmentValuationHistory.length - 1]

            if (Array.from(new Set([...lastValuation[0].split('.'), ...date.split('.')])).length > 3) {
                if (lastValuation && lastValuation.length > 2) user.investmentValuationHistory[user.investmentValuationHistory.length - 1] = lastValuation.slice(0, 3)
                user.investmentValuationHistory.push([date, totalCost, totalMarketValue, 1])
            }
            else {
                if (lastValuation[1] != totalCost) user.investmentValuationHistory[user.investmentValuationHistory.length - 1] = [date, totalCost, totalMarketValue, 1]
                else {
                    const counter = lastValuation[3];
                    user.investmentValuationHistory[user.investmentValuationHistory.length - 1] = [
                        date,
                        +(((lastValuation[1] * counter) + totalCost) / (counter + 1)).toFixed(2),
                        +(((lastValuation[2] * counter) + totalMarketValue) / (counter + 1)).toFixed(2),
                        counter + 1
                    ]
                }
            }
        }

        user.investmentsMarketPriceUpdateStatus.isUpdating = false
        user.investmentsMarketPriceUpdateStatus.lastUpdateDate = new Date()

        const save = await user.save();
        if (save) return res.json({ success: true, user })
    }
    catch (error) {
        user.investmentsMarketPriceUpdateStatus.isUpdating = false;

        console.error((error.message || 'An error occurred while saving user.') + ' (/update-investments-market-price)')
        return res.json({ success: false, msg: 'An error occurred while updating investments market price.' });
    }
})

// User Operations

router.post('/update-user-informations', async (req, res) => {
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

router.post('/delete-account', async (req, res) => {
    const { userId } = req.body

    let user = await getUser(userId)
    if (!user.success) return res.json(user)

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