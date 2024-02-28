const express = require('express')
const router = express.Router()
const MajorItemsPriceChangesModel = require('../models/majorItemsPriceChangesModel');
const OperationItemsPriceChangesModel = require('../models/operationItemsPriceChangesModel');
const MajorItemsPriceHistoryModel = require('../models/majorItemsPriceHistoryModel');

const currencyNumber = 1;

router.get('/get-price-history/:sticker', async (req, res) => {
    let data = await fetch('https://steamcommunity.com/market/pricehistory/?appid=730&currency=' + currencyNumber + '&format=json&market_hash_name=' + req.params.sticker, {
        headers: { 'Cookie': 'steamLoginSecure=' + process.env.STEAM + ';' }
    }).then(_res => _res.json()).catch(err => console.log(err))
    return res.json(data)
})

router.get('/get-major-items-price-changes-data/:eventName/:itemType/:stickerType', async (req, res) => {
    const { eventName, itemType, stickerType } = req.params

    let data = await MajorItemsPriceChangesModel.findOne({ name: eventName })
    if (itemType == 'stickers' || itemType == 'autographs' || itemType == 'patches') {
        return res.json({ success: !!data, name: data.name, lastUpdate: data.lastUpdate, [itemType]: data[itemType][stickerType], [itemType + 'AverageValues']: data[itemType + 'AverageValues'][stickerType] })
    }
    else if (itemType == 'capsules' || itemType == 'souvenir-packages' || itemType == 'patch-packs') {
        return res.json({ success: !!data, name: data.name, lastUpdate: data.lastUpdate, [itemType]: data[itemType], [itemType + 'AverageValues']: data[itemType + 'AverageValues'] })
    }
})

router.get('/get-operation-items-price-changes-data/:eventName/:itemType', async (req, res) => {
    const { eventName, itemType } = req.params

    let data = await OperationItemsPriceChangesModel.findOne({ name: eventName })
    return res.json({ success: !!data, name: eventName, lastUpdate: data.lastUpdate, [itemType]: data[itemType], [itemType + 'AverageValues']: data[itemType + 'AverageValues'] })
})

router.get('/get-major-items-price-history-data/:eventName', async (req, res) => {
    const { eventName } = req.params

    let data = await MajorItemsPriceHistoryModel.findOne({ name: eventName })
    return res.json({ success: !!data, name: eventName, stickers: data && data.stickers, capsules: data && data.capsules })
})

module.exports = router