const mongoose = require('mongoose')

const majorItemsPriceChangesModel = mongoose.Schema({
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
    autographs: {
        type: Object,
        required: false
    },
    capsules: {
        type: Array,
        required: true
    },
    'souvenir-packages': {
        type: Array,
        required: false
    },
    patches: {
        type: Object,
        required: false
    },
    'patch-packs': {
        type: Array,
        required: false
    },
    stickersAverageValues: {
        type: Object,
        required: true
    },
    autographsAverageValues: {
        type: Object,
        required: false
    },
    capsulesAverageValues: {
        type: Object,
        required: true
    },
    'souvenir-packagesAverageValues': {
        type: Object,
        required: false
    },
    patchesAverageValues: {
        type: Object,
        required: false
    },
    'patch-packsAverageValues': {
        type: Object,
        required: false
    }
})

module.exports = mongoose.model('majorItemsPriceChanges', majorItemsPriceChangesModel)