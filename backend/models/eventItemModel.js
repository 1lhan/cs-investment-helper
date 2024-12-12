const mongoose = require('mongoose')

const schema = mongoose.Schema({
    eventName: {
        type: String,
        required: true
    },
    type: { // sticker, autograph, capsule, patch
        type: String,
        required: true
    },
    variant: { // paper, glitter, foil, holo, gold, lenticular
        type: String,
        required: false
    },
    items: {
        type: Array,
        required: true
    }
})

module.exports = mongoose.model('Item', schema)