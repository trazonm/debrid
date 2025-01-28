const { Pool } = require('pg');
require('dotenv').config();
const pool = require('../utils/pool');

const createUserTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            downloads JSONB DEFAULT '[]'
        );
    `;
    await pool.query(query);
};

const getUsers = async () => {
    const result = await pool.query('SELECT * FROM users');
    return result.rows;
};

const findUserByUsername = async (username) => {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
};

const createUser = async (username, password) => {
    const query = `
        INSERT INTO users (username, password)
        VALUES ($1, $2)
        RETURNING *;
    `;
    const result = await pool.query(query, [username, password]);
    return result.rows[0];
};

const updateUserDownloads = async (username, downloads) => {
    const query = `
        UPDATE users
        SET downloads = $1
        WHERE username = $2;
    `;
    await pool.query(query, [JSON.stringify(downloads), username]);
};

const deleteDownloadById = async (userId, downloadId) => {
    console.log('userId:', userId);
    console.log('downloadId:', downloadId);

    const query = `
        UPDATE users
        SET downloads = COALESCE(
            (
                SELECT jsonb_agg(elem)
                FROM jsonb_array_elements(downloads) elem
                WHERE elem->>'id' != $2
            ), '[]'::jsonb
        )
        WHERE username = $1;
    `;
    await pool.query(query, [userId, downloadId]);
};

module.exports = {
    createUserTable,
    getUsers,
    findUserByUsername,
    createUser,
    updateUserDownloads,
    deleteDownloadById
};