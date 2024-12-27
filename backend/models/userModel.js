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
            name: { type: String, required: true, trim: true },
            initialPurchaseDate: { type: Date, required: true, default: new Date() },
            avgCost: { type: Number, required: true },
            quantity: { type: Number, required: true },
            currentTotalCost: { type: Number, required: true },
            totalCost: { type: Number, required: true },
            marketPrice: { type: Number, required: false },
            avgSalePrice: { type: Number, required: false },
            soldQuantity: { type: Number, required: false },
            totalSales: { type: Number, required: false },
            salesProfit: { type: Number, required: false },
            netSalesProfit: { type: Number, required: false },
            lastUpdate: { type: Object, required: false, default: null },
            tags: { type: [String], required: true }
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