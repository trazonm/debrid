const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('downloads', { scriptNonce: res.locals.scriptNonce, styleNonce: res.locals.styleNonce, user: req.session.user });
});


module.exports = router;
