const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    membershipDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    accountType: {
        type: String,
        required: true,
        enum: ['user', 'admin']
    },
    investments: [
        {
            name: { type: String, required: true },
            initialPurchaseDate: { type: Date, required: true, default: new Date() },
            totalCost: { type: Number, required: true },
            quantity: { type: Number, required: true },
            marketPrice: { type: Number, required: false },
            totalSales: { type: Number, required: true, default: 0 },
            soldQuantity: { type: Number, required: true, default: 0 },
            lastUpdate: { type: Object, required: false, default: null },
            tags: { type: Array, required: false }
        }
    ],
    investmentsMarketPriceUpdateStatus: {
        isUpdating: {
            type: Boolean,
            required: true
        },
        updateStartDate: {
            type: Date,
            required: false,
            default: null
        },
        lastUpdateDate: {
            type: Date,
            required: false,
            default: null
        }
    },
    investmentValuationHistory: [[mongoose.Schema.Types.Mixed]]
})

module.exports = mongoose.model('User', userSchema)