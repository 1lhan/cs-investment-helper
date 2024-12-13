const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
    console.log(req.body)
    const token = req.body.token.slice(6, req.body.token.length)
    if (!token) {
        return res.status(401).json({ success: false, msg: 'Access denied. No token provided.' })
    }

    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, msg: 'Invalid token.' })
        }
        req.user = decoded;
        next();
    })
}

module.exports = { authenticateToken }