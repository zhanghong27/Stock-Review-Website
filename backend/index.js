const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL setup
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(bodyParser.json());

// API to add a new stock review
app.post('/api/stocks', async (req, res) => {
    const { date, open, close, high, low } = req.body;

    try {
        // Check if a record with the same date exists
        const existing = await pool.query('SELECT * FROM reviews WHERE date = $1', [date]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: `A record for date ${date} already exists.` });
        }

        // Insert new record
        const result = await pool.query(
            'INSERT INTO reviews (date, open, close, high, low) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [date, open, close, high, low]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API to fetch all stock reviews
app.get('/api/stocks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY date DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
