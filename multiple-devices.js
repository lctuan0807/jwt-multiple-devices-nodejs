const express = require('express');
const app = express();
const port = 3000;
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

app.use(express.json());

const redis = new Redis();

redis.on('connect', () => {
  console.log('Connected to Redis successfully!');
});

const JWT_SECRET = 'jwt_secret_key';

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('>>> Decoded token:', decoded);

        // Check if the token is blacklisted
        console.log('>>> Checking if token is blacklisted in Redis');
        const isTokenBlacklisted = await redis.get(`blacklisted:${decoded.uid}_${decoded.jit}`);
        if (isTokenBlacklisted) {
            return res.status(401).json({ message: 'Token revoked' });
        }

        // check iat token
        const changedPasswordTimestamp = await redis.get(`password_changed:${decoded.uid}`);
        if (changedPasswordTimestamp && decoded.iat < parseInt(changedPasswordTimestamp)) {
            return res.status(401).json({ message: 'Token revoked due to password change' });
        }

        req.user = decoded; // Attach decoded token to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        return res.status(403).json({ message: 'Invalid token' });
    }

}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (username === 'lctuan' && password === 'password') {
        const userId = 123
        const payload = { uid: userId, jit: uuidv4(), iat: Math.floor(Date.now() / 1000) }; // iat is timestamps in seconds
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

app.post('/logout', authenticateToken, async (req, res) => {
    redis.set(`blacklisted:${req.user.uid}_${req.user.jit}`, 'true'); // Set token in Redis
    res.json({ message: 'Logged out successfully' });
});

app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
})

app.post('/change-password', authenticateToken, async (req, res) => {
    const { newPassword } = req.body;
    const userId = req.user.uid;

    // TODO: Update the user's password in the database here

    // Invalidate all existing tokens for the user by blacklisting them
    const changePasswordDate = Math.floor(Date.now() / 1000); // Get current timestamp in seconds
    const invalidationKey = `password_changed:${userId}`;
    await redis.set(invalidationKey, changePasswordDate); // Set invalidation timestamp in Redis

    // new pair token and add the current token to blacklist
    res.json({ message: 'Password changed successfully' });
})