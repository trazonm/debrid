const express = require('express');
const path = require('path');
const { fontNonce } = require('../config/cspPolicy');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', { scriptNonce: res.locals.scriptNonce, styleNonce: res.locals.styleNonce, fontNonce: res.locals.fontNonce, mediaNonce: res.locals.mediaNonce, imgNonce: res.locals.imgNonce, user: req.session.user });
});


module.exports = router;
