const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { createTables } = require('./repositories/dbInit');

const app = express();

app.use(cors());
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
