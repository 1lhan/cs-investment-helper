const mongoose = require('mongoose')

const schema = mongoose.Schema({
    eventName: {
        type: String,
        required: true
    },
    variant: {
        type: String,
        required: true
    },
    dates: [
        {
            type: Date,
            required: true
        }
    ],
    stickers: [
        {
            name: {
                type: String,
                required: true
            },
            data: [[Number, Number, Number]]
        }
    ]
})

module.exports = mongoose.model('StickerApplicationNumbers', schema)