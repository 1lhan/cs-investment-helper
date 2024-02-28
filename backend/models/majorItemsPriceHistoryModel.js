const mongoose = require('mongoose')

const majorItemsPriceHistoryModel = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    lastUpdate: {
        type: Date,
        required: true
    },
    stickers: {
        type: Object,
        required: true
    },
    capsules: {
        type: Array,
        required: true
    }
})

module.exports = mongoose.model('majorItemsPriceHistory', majorItemsPriceHistoryModel)