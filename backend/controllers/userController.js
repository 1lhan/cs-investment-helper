const express = require('express');
const UserModel = require('../models/userModel');
const router = express.Router()
const currencyNumber = 1;

const getMarketPrice = async (itemName) => {
    let getPrice = await fetch(`http://steamcommunity.com/market/priceoverview/?currency=${currencyNumber}&appid=730&market_hash_name=${itemName}`).then(res => res.json())

    return {
        success: getPrice && getPrice.success, price: (getPrice && getPrice.success && getPrice.lowest_price) ?
            (getPrice.lowest_price.includes(',') ? +getPrice.lowest_price.slice(1).replaceAll(',', '') : +getPrice.lowest_price.slice(1)) : false
    }
}

const itemTagHandler = (itemName) => {
    const itemTypes = ['Capsule', 'Case', 'Sticker', 'Gloves', 'Souvenir-Package', 'Patch', 'Agent', 'Music-Kit', 'Pass', 'Pin', 'Graffiti'] // + Skin, Knife
    const stickerTypes = ['Glitter', 'Holo', 'Foil', 'Gold', 'Lenticular']
    const knifeTypes = ['Knife', 'Bayonet', 'Karambit', 'M9 Bayonet', 'Shadow Daggers']
    const events = ['Paris-2023', 'Rio-2022', 'Antwerp-2022', 'Stockholm-2021', '2020-RMR']

    let tags = []

    if (knifeTypes.some(knifeType => itemName.includes(knifeType))) tags.push('Knife')
    else {
        for (let i in itemTypes) {
            let itemType = itemTypes[i].includes('-') ? itemTypes[i].replaceAll('-', ' ') : itemTypes[i]
            let check = itemName.includes(itemType)

            if (check) {
                if (itemType == 'Case' && itemName.includes('Gloves')) tags.push('Gloves')
                else if (itemType == 'Case' && itemName.includes('Case Hardened')) tags.push('Skin')
                else tags.push(itemTypes[i])
                break;
            }
        }
    }

    if (tags.length == 0) tags.push('Skin')

    if (tags.includes('Sticker')) {
        for (let i in stickerTypes) {
            if (itemName.includes(stickerTypes[i])) tags.push(stickerTypes[i])
        }
        if (tags.length == 1) tags.push('Paper')
    }

    for (let i in events) {
        let event = events[i].replace('-', ' ')
        if (itemName.includes(event)) tags.push(events[i])
    }

    return tags
}

const calculateSteamFee = (price) => {
    if (price <= 0.21) return price - 0.02
    else if (price > 0.21 && price <= 0.32) return price - 0.03
    else if (price > 0.32 && price <= 0.43) return price - 0.04
    else if (price > 0.43 && price <= 0.45) return 0.39
    else if (price > 0.45 && price <= 0.55) return price - 0.06
    else if (price > 0.55 && price <= 0.66) return price - 0.07
    else if (price == 0.67) return price - 0.08
    else if (price > 0.67 && price <= 0.78) return price - 0.09
    else if (price > 0.78 && price <= 0.89) return price - 0.1
    else if (price == 0.9) return price - 0.11
    else if (price > 0.9 && price <= 1.01) return price - 0.12
    else return +(price * 0.8697).toFixed(2)
}

router.get('/get-user/:username', async (req, res) => {
    let user = await UserModel.findOne({ username: req.params.username })
    return res.json({ success: !!user, user: user ? user : {}, msg: !user ? 'User could not found' : '' })
})

router.post('/add-investment', async (req, res) => {
    const { userId, name, buyPrice, quantity, date } = req.body

    let checkUser = await UserModel.findOne({ _id: userId })
    if (!checkUser) return res.json({ success: false, msg: 'User could not found' })

    let checkItemAvailable = checkUser.investments.findIndex(item => item.name == name)
    if (checkItemAvailable != -1) return res.json({ success: false, msg: 'You already have this item' })

    let checkItemName = await getMarketPrice(name)
    if (!checkItemName) res.json({ success: false, msg: 'Invalid item name' })

    let _buyPrice = buyPrice.includes(',') ? +buyPrice.replaceAll(',', '.') : +buyPrice

    let investmentItem = {
        name, status: 1, buyPrice: _buyPrice, quantity: +quantity, marketPrice: checkItemName.price, totalWorth: [0, 0], tags: [1, ...itemTagHandler(name)],
        actionHistory: [{ actionType: 1, price: _buyPrice, quantity: +quantity, date }]
    }

    let addInvestment = await UserModel.findOneAndUpdate({ _id: userId }, { $push: { investments: investmentItem } }, { new: true })
    return res.json({ success: !!addInvestment, user: addInvestment ? addInvestment : {} })
})

router.post('/delete-investment-item', async (req, res) => {
    const { userId, itemId } = req.body

    let user = await UserModel.findOne({ _id: userId })
    if (!user) return res.json({ success: false, msg: 'User could not found' })

    let item = user.investments.find(item => item._id == itemId)
    if (item == 'undefined') return res.json({ success: false, msg: 'Item could not found' })

    let _delete = await UserModel.findOneAndUpdate({ _id: userId }, { $pull: { investments: { _id: itemId } } }, { new: true })
    return res.json({ success: !!_delete, user: _delete ? _delete : {} })
})

router.post('/update-investment-item-market-price', async (req, res) => {
    const { userId, name, index, length } = req.body

    let user = UserModel.findOne({ _id: userId })
    if (!user) return res.json({ success: false, msg: 'User could not found' })

    let marketPrice = await getMarketPrice(name)
    if (!marketPrice || !marketPrice.success) return res.json({ success: false, msg: 'steam 429 error' })

    let updateString = (marketPrice.success && marketPrice.price) ? { 'investments.$.marketPrice': marketPrice.price } : {}
    let update = await UserModel.findOneAndUpdate({ _id: userId, 'investments': { $elemMatch: { name } } }, { $set: updateString })

    if (index == length - 1) {
        let updateLastInvestmentsMarketPriceUpdateDate = await UserModel.findOneAndUpdate({ _id: userId }, { $set: { 'accountInformations.lastInvestmentsMarketPriceUpdateDate': new Date() } }, { new: true })
        return res.json({ success: !!updateLastInvestmentsMarketPriceUpdateDate, user: updateLastInvestmentsMarketPriceUpdateDate ? updateLastInvestmentsMarketPriceUpdateDate : {} })
    }
    else return res.json({ success: !!update })
})

router.post('/update-investments-value-history', async (req, res) => {
    const { userId, date } = req.body

    let user = await UserModel.findOne({ _id: userId })
    if (!user) return res.json({ success: false, msg: 'User could not found' })

    let investments = user.investments.filter(item => item.status == 1)
    let cost = +investments.reduce((t, c) => { return t + (c.buyPrice * c.quantity) }, 0).toFixed(2)
    let value = +investments.reduce((t, c) => { return t + (c.marketPrice * c.quantity) }, 0).toFixed(2)

    let lastItem = user.investmentsValueHistory[user.investmentsValueHistory.length - 1] // en sonuncu investment value history objesi
    let update;

    if (lastItem == undefined || ((new Date(lastItem.date) - new Date(date)) / (1000 * 60 * 60 * 24)) >= 1 || new Date(lastItem.date).getDate() != new Date(date).getDate()) {
        update = await UserModel.findOneAndUpdate({ _id: userId }, { $push: { investmentsValueHistory: { cost: cost.toFixed(2), value: value.toFixed(2), counter: 1, date: new Date() } } }, { new: true })
    }
    else if (lastItem.cost != cost) {
        update = await UserModel.findOneAndUpdate(
            { _id: userId, 'investmentsValueHistory': { $elemMatch: { _id: lastItem._id } } },
            {
                $set: {
                    'investmentsValueHistory.$.cost': cost.toFixed(2),
                    'investmentsValueHistory.$.value': value.toFixed(2),
                    'investmentsValueHistory.$.counter': 1,
                    'investmentsValueHistory.$.date': new Date(),
                }
            },
            { new: true }
        )
    }
    else {
        let newValue = (((lastItem.value * lastItem.counter) + value) / (lastItem.counter + 1)).toFixed(2)
        update = await UserModel.findOneAndUpdate(
            { _id: userId, 'investmentsValueHistory': { $elemMatch: { _id: lastItem._id } } },
            {
                $set: {
                    'investmentsValueHistory.$.value': newValue,
                    'investmentsValueHistory.$.date': new Date()
                },
                $inc: { 'investmentsValueHistory.$.counter': 1 }
            },
            { new: true }
        )
    }
    return res.json({ success: !!update, user: update ? update : {} })
})

router.post('/add-purchase-sale', async (req, res) => {
    const { userId, itemId, price, quantity, date, actionType } = req.body

    let user = await UserModel.findOne({ _id: userId })
    if (!user) return res.json({ success: false, msg: 'User could not found' })

    let item = user.investments.find(item => item._id == itemId)
    if (item == 'undefined') return res.json({ success: false, msg: 'Item could not found' })

    let update;
    let marketPrice = getMarketPrice(item.name)
    marketPrice = marketPrice.success ? marketPrice.price : false

    if (actionType == 1) {
        let _price = price.includes(',') ? +price.replaceAll(',', '.') : +price
        let newQuantity = item.quantity + +quantity
        let newBuyPrice = ((item.buyPrice * item.quantity) + (_price * +quantity)) / newQuantity

        update = await UserModel.findOneAndUpdate({ _id: userId, investments: { $elemMatch: { _id: itemId } } }, {
            $set: {
                'investments.$.status': 1,
                'investments.$.buyPrice': newBuyPrice,
                'investments.$.quantity': newQuantity,
                'investments.$.marketPrice': marketPrice || item.marketPrice,
            },
            $push: { 'investments.$.actionHistory': { actionType, price: _price, quantity, date } }
        }, { new: true })

    }
    else {
        if (quantity > item.quantity) return res.json({ success: false, msg: 'Quantity that you want to sell can not be more than you have' })

        let _price = price.includes(',') ? +price.replaceAll(',', '.') : +price
        let newQuantity = item.quantity - +quantity
        let worth = (_price - +item.buyPrice) * +quantity
        let netWorth = (calculateSteamFee(_price) * quantity) - (item.buyPrice * quantity)
        let currentWorth = item.totalWorth
        currentWorth[0] += worth
        currentWorth[1] += netWorth

        update = await UserModel.findOneAndUpdate({ _id: userId, investments: { $elemMatch: { _id: itemId } } }, {
            $set: {
                'investments.$.buyPrice': newQuantity == 0 ? 0 : item.buyPrice,
                'investments.$.status': newQuantity == 0 ? 0 : 1,
                'investments.$.quantity': newQuantity,
                'investments.$.marketPrice': marketPrice || item.marketPrice,
                'investments.$.totalWorth': currentWorth
            },
            $push: { 'investments.$.actionHistory': { actionType, price: _price, quantity, date }, }
        }, { new: true })

    }
    return res.json({ success: !!update, user: update ? update : {} })
})

router.post('/change-investment-visibility', async (req, res) => {
    const { userId, value } = req.body
    let user = await UserModel.findOne({ _id: userId })
    if (!user) return res.json({ success: false, msg: 'User could not found' })

    let update = await UserModel.findOneAndUpdate({ _id: userId }, { $set: { 'accountSettings.investmentVisibility': value } }, { new: true })
    return res.json({ success: !!update, user: update ? update : {} })
})

module.exports = router