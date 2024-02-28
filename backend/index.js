const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.json({ limit: '25mb' }))

const mainController = require('./controllers/mainController')
const adminController = require('./controllers/adminController')
const authController = require('./controllers/authController')
const userController = require('./controllers/userController')

app.use(mainController)
app.use(adminController)
app.use(authController)
app.use(userController)

app.listen(5000, () => { console.log('server running') })

mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => console.log('connected to mongodb'))
    .catch(error => console.log(error))