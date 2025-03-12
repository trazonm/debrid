const express = require('express');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Node.js 16.4.0+ only

const router = express.Router();

router.get('/', (req, res) => {
    res.render('downloads', { scriptNonce: res.locals.scriptNonce, styleNonce: res.locals.styleNonce, fontNonce: res.locals.fontNonce, mediaNonce: res.locals.mediaNonce, imgNonce: res.locals.imgNonce, user: req.session.user });
});

module.exports = router;
