const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// DB Config
const db = process.env.MONGO_URI || 'mongodb://localhost:27017/medical_ai';

// Connect to MongoDB
mongoose
    .connect(db)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/chat', require('./routes/chat'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;

    if (statusCode === 500 && !err.expose) {
        return res.status(500).send('Server Error');
    }

    return res.status(statusCode).json({
        message: err.message,
        ...(err.raw ? { raw: err.raw } : {})
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
