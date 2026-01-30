const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { createTables } = require('./repositories/dbInit');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*', // Should be set to frontend URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate Limiting (General)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.use(express.json());

createTables().catch(err => console.error('Failed to create tables:', err));

app.use('/api', routes);


app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});


app.use((err, req, res, next) => {
    console.error("Global Error Handler Caught:", err);
    if (err.name === 'MulterError') {
        return res.status(400).json({ message: `Upload Error: ${err.message}`, code: err.code });
    }
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
