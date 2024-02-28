const express = require('express');
const router = express.Router();
const UserModel = require('../models/userModel')
const bcrypt = require('bcrypt')
const saltRounds = 10;
const jwt = require('jsonwebtoken')
require('dotenv').config()

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    let checkUsername = await UserModel.findOne({ username })
    if (checkUsername) return res.json({ success: false, msg: 'The username already been using' })

    let checkEmail = await UserModel.findOne({ email })
    if (checkEmail) return res.json({ success: false, msg: 'The email already been using' })

    let hashedPassword = await bcrypt.hash(password, saltRounds)

    /*!*/
    const user = new UserModel({
        username, email, password: hashedPassword, accountInformations: { accountType: 'user', membershipDate: new Date(), lastInvestmentsMarketPriceUpdateDate: null },
        accountSettings: { investmentVisibility: false }, investmentsValueHistory: [], investments: []
    })
    let register = await user.save()

    return res.json({ success: !!register, msg: register ? '' : 'Account could not create' })
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body

    let user = await UserModel.findOne({ username })

    if (user != null) {
        let passwordControl = await bcrypt.compare(password, user.password)

        if (passwordControl) {
            user.password = ''
            const accessToken = jwt.sign({ _id: user._id }, process.env.SECRET_TOKEN, { expiresIn: '7d' })
            return res.json({ success: true, user, token: accessToken })
        }
    }
    return res.json({ success: false, msg: 'No user matching with this informations' })
})

router.post('/auto-login', async (req, res) => {
    try {
        const token = req.body.token.slice(6, req.body.token.length)
        if (!token) return res.json({ success: false })

        let verify = jwt.verify(token, process.env.SECRET_TOKEN)
        if (!verify) return res.json({ success: false })

        let user = await UserModel.findOne({ _id: verify._id }).select('-password')
        return res.json({ success: !!user, user: user ? user : false })
    }
    catch (error) {
        return res.json({ success: false })
    }
})

router.post('/change-password', async (req, res) => {
    const { userId, password, newPassword } = req.body

    let user = await UserModel.findOne({ _id: userId })
    if (!user) return res.json({ success: false, msg: 'User could not be found' })

    let passwordControl = await bcrypt.compare(password, user.password)
    if (!passwordControl) return res.json({ success: false, msg: 'Password is wrong' })

    let hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    let update = UserModel.findOneAndUpdate({ _id: userId }, { $set: { password: hashedPassword } })
    return res.json({ success: !!update, msg: update ? '' : 'Password could not be changed' })
})

module.exports = router