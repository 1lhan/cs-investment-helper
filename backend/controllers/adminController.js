const express = require('express')
const router = express.Router()
const MajorItemsPriceChangesModel = require('../models/majorItemsPriceChangesModel')
const OperationItemsPriceChangesModel = require('../models/operationItemsPriceChangesModel')
const MajorItemsPriceHistoryModel = require('../models/majorItemsPriceHistoryModel')

router.post('/update-major-items-price-changes-data', async (req, res) => {
    const update = await MajorItemsPriceChangesModel.findOneAndUpdate(
        { name: req.body.name },
        req.body,
        { upsert: true, new: true }
    )
    // upsert ile eğer name'i req.body.name ile eşleşen bir veri bulursa veriyi günceller eğer yoksa da yeni veri olarak veritabanına kaydeder
    // new:true veri kaydedilme ya da güncelleme işleminde sonra yeni veriyi geri döndürür
    return res.json({ success: !!update })
})

router.post('/update-operation-items-price-changes-data', async (req, res) => {
    const update = await OperationItemsPriceChangesModel.findOneAndUpdate(
        { name: req.body.name },
        req.body,
        { upsert: true, new: true }
    )
    return res.json({ success: !!update })
})

router.post('/update-major-items-price-history-data', async (req, res) => {
    const update = await MajorItemsPriceHistoryModel.findOneAndUpdate(
        { name: req.body.name },
        req.body,
        { upsert: true, new: true }
    )
    return res.json({ success: !!update })
})

module.exports = router