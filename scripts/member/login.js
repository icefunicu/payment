/**
 * 检查用户状态
 */
const constant = require('../../config/constant');
const mongo = require('../../config/database');
const tool = require('../../utils/tool');


module.exports = {
    /**
     * 判断是否登录
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async CheckLogin(req, res, next) {
        let uid = req.cookies[constant.CUSTOMER_COOKIE_NAME];
        if (!uid) {
            if (req.method == 'GET') {
                res.redirect(constant.CUSTOMER_LOGIN_PATH);
            } else {
                res.json({ login: true, message: '请先登录', path: constant.CUSTOMER_LOGIN_PATH });
            }
            return;
        }
        let doc = await mongo.Coll('login').findOne({ session: uid, type: constant.CUSTOMER });
        if (!doc) {
            if (req.method == 'GET') {
                res.redirect(constant.CUSTOMER_LOGIN_PATH);
            } else {
                res.json({ login: true, message: '请先登录', path: constant.CUSTOMER_LOGIN_PATH });
            }
            return;
        }
        //登录超时
        let ms = new Date().getTime() - doc.user.login_time.getTime();
        if (Math.abs(ms) > 1000 * 60 * 60 * 24) {
            await mongo.Coll('login').remove({ session: uid, type: constant.CUSTOMER });
            if (req.method == 'GET') {
                res.redirect(constant.CUSTOMER_LOGIN_PATH);
            } else {
                res.json({ login: true, message: '请先登录', path: constant.CUSTOMER_LOGIN_PATH });
            }
            return
        }

        /** 设置登陆用户信息 */
        let user_doc = await mongo.Coll('member').findOne({ 'mbr-account': doc.user.account });
        if (!user_doc) {
            if (req.method == 'GET') {
                res.redirect(constant.CUSTOMER_LOGIN_PATH);
            } else {
                res.json({ login: true, message: '请先登录', path: constant.CUSTOMER_LOGIN_PATH });
            }
            return
        }
        if (new Date(user_doc['mbr-end-date']) < new Date()) {
            if (req.method == 'GET') {
                res.redirect(constant.CUSTOMER_LOGIN_PATH);
            } else {
                res.json({ login: true, message: '请重新登录', path: constant.CUSTOMER_LOGIN_PATH });
            }
            return;
        }
        user_doc.acc = user_doc.account;
        user_doc.manage = constant.CUSTOMER_MANAGE_PATH;
        if (!user_doc.nickname) {
            user_doc.nickname = user_doc.account;
        }

        //存储到系统
        res.app.locals.customer = user_doc;
        next();
    },
    /**
     * 存储用户状态到浏览器
     * @param {*} res 
     */
    async SaveState(res, acc) {
        //存储登陆的账户信息
        let uid = tool.random(29, 29);
        await mongo.Coll('login').updateOne(
            { session: uid },
            {
                $set: {
                    session: uid,
                    type: constant.CUSTOMER,
                    user: {
                        login_time: new Date(),
                        account: acc
                    }
                }
            }, { upsert: true });

        res.cookie(constant.CUSTOMER_COOKIE_NAME, uid, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, path: constant.CUSTOMER_MANAGE_PATH, sameSite: 'Strict' });
    },
    /**
     * 用户退出
     */
    async Level(req, res) {
        let uid = req.cookies[constant.CUSTOMER_COOKIE_NAME];
        await mongo.Coll('login').remove({ session: uid });
        res.cookie(constant.CUSTOMER_COOKIE_NAME, '-1', { maxAge: -1, httpOnly: true, path: constant.CUSTOMER_MANAGE_PATH, sameSite: 'Strict' });
    },
    USER:{
        "mbr-pid":tool.random(3, 10),//api id
        "mbr-account": '',
        "mbr-name": '',
        "add_time": new Date(),
        "mbr-end-date": tool.dateFormat(new Date().setHours(72), 'yyyy-MM-dd'),

        "mbr-password": '',
        "mbr-pay-code": tool.password.Encoding3('123456'),
        "mbr-pid": tool.random(3, 10),
        "mbr-risk": {
            "useTimeStart":"08:00",
            "useTimeEnd":"20:00",

            "pay_types": null,
            "dayMax":"20000",
            "draw_min_one":"500",
            "frequency": "T30",
            "draw_max_one": "100",
            "draw_max_day": "500",
            "mbr-api-pay-use": "未开通"
        },

        "avatar": "/avatar/avatar5.png",
        "mbr-acc-agent-type": "普通账户",
        "mbr-acc-type": "基本户",
        "mbr-access-used": "未开通",
        "mbr-api-pay-use": "未开通",

        "mbr-sign-key": tool.random(3, 24),
        "mbr-is-use": "启用",
        "mbr-web-site": "",
        "mbr-web-url": ""
    }
};