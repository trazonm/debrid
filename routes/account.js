const express = require('express');
const { createUser, findUserByUsername, updateUserDownloads, deleteDownloadById } = require('../models/user');
const sessionMiddleware = require('../middlewares/authMiddleware');
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing
const router = express.Router();

async function verifyRecaptcha(token) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `secret=${secretKey}&response=${token}`
    });
    const data = await response.json();
    return data.success;
}

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (await findUserByUsername(username)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    await createUser(username, hashedPassword); // Save the hashed password
    res.status(201).json({ message: 'User registered successfully' });
});

router.post('/login', async (req, res) => {
    const { username, password, token } = req.body;
    const recaptchaSuccess = await verifyRecaptcha(token);
    if (!recaptchaSuccess) {
        return res.status(401).json({ success: false, message: 'reCAPTCHA verification failed' });
    }
    const user = await findUserByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) { // Compare hashed passwords
        req.session.user = username;
        res.cookie('isLoggedIn', 'true', {
            path: '/',
            sameSite: 'Lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        });
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

router.post('/updateDownload', sessionMiddleware, async (req, res) => {
    const { id, filename, progress, link } = req.body;
    const user = await findUserByUsername(req.session.user);
    const downloadIndex = user.downloads.findIndex(download => download.id === id);

    if (downloadIndex !== -1) {
        user.downloads[downloadIndex] = { id, filename, progress, link };
    } else {
        user.downloads.push({ id, filename, progress, link });
    }

    await updateUserDownloads(user.username, user.downloads);
    res.json({ success: true });
});

router.get('/downloads', sessionMiddleware, async (req, res) => {
    const user = await findUserByUsername(req.session.user);
    res.json(user.downloads.map(download => ({
        id: download.id,
        filename: download.filename,
        progress: download.progress,
        link: download.link
    })));
});

router.delete('/delete/:id', sessionMiddleware, async (req, res) => {
    const user = await findUserByUsername(req.session.user);
    await deleteDownloadById(user.username, req.params.id);
    res.json({ success: true });
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to logout' });
        }
        res.cookie('isLoggedIn', '', {
            path: '/',
            sameSite: 'Lax',
            maxAge: 0 // Clears the cookie immediately
        });
        res.json({ success: true });
    });
});

module.exports = router;