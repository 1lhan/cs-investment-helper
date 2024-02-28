const mongoose = require('mongoose')

const operationItemsPriceChangesModel = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    lastUpdate: {
        type: Date,
        required: true
    },
    stickers: {
        type: Array,
        required: false
    },
    agents: {
        type: Array,
        required: false
    },
    case: {
        type: Array,
        required: false
    },
    patches: {
        type: Array,
        required: false
    },
    graffitis: {
        type: Array,
        required: false
    },
    stickersAverageValues: {
        type: Object,
        required: false
    },
    agentsAverageValues: {
        type: Object,
        required: false
    },
    caseAverageValues: {
        type: Object,
        required: false
    },
    patchesAverageValues: {
        type: Object,
        required: false
    },
    graffitisAverageValues: {
        type: Object,
        required: false
    }
})

module.exports = mongoose.model('operationItemsPriceChanges', operationItemsPriceChangesModel)