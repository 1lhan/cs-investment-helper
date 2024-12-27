const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.json({ limit: '25mb' }))

const allowedOrigins = [process.env.ALLOWED_ORIGIN];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) callback(null, true)
        else callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));

app.use(require('./controllers/controller'))
//app.use(require('./controllers/dataController'))
app.use(require('./controllers/authController'))

app.listen(5000, () => { console.log('server running') })

mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => console.log('connected to mongodb'))
    .catch(error => console.log(error))