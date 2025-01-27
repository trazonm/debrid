const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createIpTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS iplog (
                id SERIAL PRIMARY KEY,
                ip VARCHAR(45) NOT NULL,
                location VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (err) {
        console.error('Error creating iplog table:', err);
    } finally {
        client.release();
    }
};

const logIp = async (ip, location) => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT COUNT(*) FROM iplog WHERE ip = $1', [ip]);
        if (parseInt(result.rows[0].count) === 0) {
            await client.query('INSERT INTO iplog (ip, location) VALUES ($1, $2)', [ip, location]);
        }
    } catch (err) {
        console.error('Error logging IP:', err);
    } finally {
        client.release();
    }
};

module.exports = {
    createIpTable,
    logIp,
};
