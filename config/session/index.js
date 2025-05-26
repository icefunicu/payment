/**
 * Session 如 mongoDB 库
 */
const constant = require('../constant');
const session3 = require('express-session');
const mongo_server = require('../database');


module.exports = session3({
    name: constant.WEB_SESSION_NAME,
    secret: constant.WEB_SESSION_SECRET,//加密秘钥
    saveUninitialized: true,
    rolling: true,
    cookie: {
        httpOnly: true,
        sameSite: 'Strict',
        path: '/',
        maxAge: 100000
    },
    store: mongo_server.SessionStore,
    resave: true
});