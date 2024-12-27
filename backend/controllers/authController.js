const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const saltRounds = 10
const userModel = require('../models/userModel')
const { authenticateToken } = require('../utils')

router.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const isUsernameExist = await userModel.findOne({ username })
        if (isUsernameExist) return res.json({ success: false, msg: 'Username already exist.' })
    }
    catch (error) { return res.json({ success: false, msg: 'Error occurred while checking the username.' }) }

    try {
        const isEmailExist = await userModel.findOne({ email })
        if (isEmailExist) return res.json({ success: false, msg: 'Email already exist.' })
    }
    catch (error) { return res.json({ success: false, msg: 'Error occurred while checking the email.' }) }

    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const user = new userModel({
        username, password: hashedPassword, email, membershipDate: new Date(), accountType: 'user',
        investments: [], investmentsMarketPriceUpdateStatus: { isUpdating: false, updateStartDate: null, lastUpdateDate: null }, investmentValuationHistory: []
    })

    try {
        await user.save()
        return res.json({ success: true })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while saving the user.') + ' (/signup)')
        return res.json({ success: false, msg: 'An error occurred while creating your account.' })
    }
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body

    let user;
    try {
        user = await userModel.findOne({ username })
        if (!user) return res.json({ success: false, msg: 'No user found with this informations.' })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while finding the user.') + ' (/login)')
        return res.json({ success: false, msg: 'Error occurred while finding the user.' })
    }

    const isPasswordTrue = await bcrypt.compare(password, user.password)
    if (!isPasswordTrue) return res.json({ success: false, msg: 'No user found with this informations.' })

    delete user.password
    const _jwt = jwt.sign({ _id: user._id }, process.env.SECRET_TOKEN, { expiresIn: '30d' })
    return res.json({ success: true, user, token: _jwt })
})

router.post('/auto-login', authenticateToken, async (req, res) => {
    try {
        const token = req.body.token.slice(6, req.body.token.length)
        if (!token) return res.json({ success: false })

        const verify = jwt.verify(token, process.env.SECRET_TOKEN)
        if (!verify) return res.json({ success: false })

        const user = await userModel.findOne({ _id: verify._id }).select('-password')
        return res.json({ success: !!user, user: user ? user : false })
    }
    catch (error) { return res.json({ success: false }) }
})

router.post('/change-password', authenticateToken, async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body

    try {
        let user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, msg: 'User could not be found.' })

        const isPasswordTrue = await bcrypt.compare(currentPassword, user.password)
        if (!isPasswordTrue) return res.json({ success: false, msg: 'Password is wrong.' })

        const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

        const update = await userModel.findOneAndUpdate({ _id: userId }, { password: hashedPassword })
        if (!update) return res.json({ success: false, msg: 'Failed to change password.' })
        return res.json({ success: true })
    }
    catch (error) {
        console.error((error.message || 'An error occurred while changing password.') + ` (/change-password, userId: ${userId})`)
        return res.json({ success: false, msg: 'An error occurred while changing password.' })
    }
})

module.exports = router