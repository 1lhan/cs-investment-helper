const mongoose = require('mongoose')

const userModel = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    accountInformations: {
        accountType: {
            type: String,
            required: true
        },
        membershipDate: {
            type: Date,
            required: true
        },
        lastInvestmentsMarketPriceUpdateDate: {
            type: Date,
            required: false
        }
    },
    accountSettings: {
        investmentVisibility: {
            type: Boolean,
            required: true
        }
    },
    investmentsValueHistory: [
        {
            cost: {
                type: Number,
                required: true
            },
            value: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                required: true
            },
            counter: {
                type: Number,
                required: false
            }
        }
    ],
    investments: [{
        name: {
            type: String,
            required: true
        },
        status: {
            type: Number,
            required: true
        },
        buyPrice: {
            type: Number,
            required: false
        },
        quantity: {
            type: Number,
            required: true
        },
        marketPrice: {
            type: Number,
            required: false
        },
        totalWorth: {
            type: Array,
            required: false
        },
        tags: {
            type: Array,
            reqiured: false
        },
        actionHistory: [{
            actionType: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: false
            },
            quantity: {
                type: Number,
                required: true
            },
            date: {
                type: String,
                required: false
            }
        }]
    }]
})

module.exports = mongoose.model('user', userModel)