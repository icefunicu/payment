/* 管理员 */
const router = require(`express`).Router();
const mongo = require('../../config/database');
const tool = require('../../utils/tool');
const constant = require('../../config/constant');
const fs = require('fs')
const notice = require('../../utils/notice');
const http = require('../../utils/http');
const cache = require('../../config/cache');
const _lodash = require('lodash')
const { OrderState } = require('../gateway/order');
/**
 * 网站后台 支持安装为网页应用[√]
 */
router.get('/manifest', (req, res, next) => {
    res.json({
        "name": "支付系统",
        "start_url": "/admin",
        "display": "standalone",
        "icons": [
            {
                "src": "/images/logo.png",
                "sizes": "463x154",
                "type": "image/png"
            }
        ]
    });
});

/**
 * 验证是否登陆[√]
 */
router.all(['/', '/*'], async (req, res, next) => {
    if (req.url == constant.ADMIN_MANAGE_LOGIN) {
        next();
        return;
    }
    let go_login = function () {
        if (req.method == 'POST') {
            res.json({ message: res.__('tip-message.need-login'), needLogin: true, url: constant.ADMIN_MANAGE_PATH_LOGIN });
            return
        }
        res.redirect(constant.ADMIN_MANAGE_PATH_LOGIN);
    }
    let uid = req.cookies[constant.ADMIN_MANAGE_COOKIE_NAME];
    if (uid) {
        let doc = await mongo.Coll('login').findOne({ session: uid, type: constant.ADMIN });
        if (doc) {
            let ms = new Date().getTime() - doc.user.login_time.getTime();
            if (Math.abs(ms) > 1000 * 60 * 60 * 24) {
                await mongo.Coll('login').remove({ session: uid, type: constant.ADMIN });
                go_login();
                return
            }
            /** 设置登陆用户信息 */
            let user_doc = await mongo.Coll('admin').findOne({ account: doc.user.account });
            user_doc.acc = user_doc.account;
            user_doc.manage = constant.ADMIN_MANAGE_PATH;
            if (!user_doc.nickname) {
                user_doc.nickname = user_doc.account;
            }
            //存储到系统
            res.app.locals.user = user_doc
            next();
        } else {
            go_login();
        }
    }
    else {
        go_login();
    }
})

/**
 * 登陆页面[√]
 */
router.get(constant.ADMIN_MANAGE_LOGIN, async (req, res, next) => {
    //已经登陆时 转向到主页面
    let uid = req.cookies[constant.ADMIN_MANAGE_COOKIE_NAME];
    if (uid) {
        let doc = await mongo.Coll('login').findOne({ session: uid, type: constant.ADMIN, });
        if (doc) {
            //转向到主页面
            res.redirect(constant.ADMIN_MANAGE_PATH);
            return;
        }
    }
    let bgImageUrl = null;
    try {
        bgImageUrl = cache.get('cache-admin-login-bg-image');
        if (!bgImageUrl) {
            console.log('请求网络')
            let img = await http.get('https://cn.bing.com/hp/api/model');
            bgImageUrl = img.data.MediaContents[0].ImageContent.Image.Url;
            if (bgImageUrl.startsWith('/th?')) {
                bgImageUrl = `https://cn.bing.com${bgImageUrl}`;
            }
            cache.set('cache-admin-login-bg-image', bgImageUrl, 60 * 60 * 12);//12 小时
        }
    } catch (e) {
        console.error('bing 背景图片读取失败');
        bgImageUrl = 'https://cn.bing.com/th?id=OHR.WaningGibbous_ZH-CN9648865417_1920x1080.jpg';
    }

    let rCode = tool.random(29, _lodash.random(5, 12));
    req.session['r_code'] = rCode;

    if (uid) {
        res.cookie(constant.ADMIN_MANAGE_COOKIE_NAME, '', { maxAge: -1, httpOnly: true, sameSite: 'Strict' })
    }
    res.render('shared/login', {
        "code": rCode, "bg_image": bgImageUrl,
        user: {
            account: process.env.NODE_ENV == constant.StartModel.PRODUCTION ? '' : 'admin',
            password: process.env.NODE_ENV == constant.StartModel.PRODUCTION ? '' : 'admin909'
        }
    });

})
/**
 * 退出登陆[√]
 */
router.get(constant.ADMIN_MANAGE_PATH_LOGIN_OUT, (req, res) => {
    let uid = req.cookies[constant.ADMIN_MANAGE_COOKIE_NAME];
    res.cookie(constant.ADMIN_MANAGE_COOKIE_NAME, '', { maxAge: -1, httpOnly: true, sameSite: 'Strict' })
    if (uid) {
        mongo.Coll('login').remove({ session: uid, type: constant.ADMIN }).then(() => {
            res.redirect(constant.ADMIN_MANAGE_PATH_LOGIN);
        })
    } else {
        res.redirect(constant.ADMIN_MANAGE_PATH_LOGIN);
    }
})
/**
 * 处理登陆请求[√]
 */
router.post(constant.ADMIN_MANAGE_LOGIN, async (req, res, next) => {
    let rCode = req.session['r_code'];
    let email = req.body[rCode + 'email'];
    let password = req.body[rCode + 'password'];
    let code = req.body[rCode + 'captcha'];
    if (!email) {
        res.json({ message: res.__('input.input-account') });
        return
    }
    if (!password) {
        res.json({ message: res.__('input.input-password') });
        return
    }
    if (!code) {
        res.json({ message: res.__('input.auth-code') });
        return
    }
    //验证码使者正确
    let captcha = require('../../utils/captcha');
    if (!captcha.Validation(req, code)) {
        res.json({ message: res.__('input.input-captcha-error') });
        return;
    }
    //用户表是否有数据
    let doc = await mongo.Coll('admin').findOne({ account: email, password: tool.password.Encoding(password) });
    if (doc) {
        var uid = tool.random(29, 29);
        res.cookie(constant.ADMIN_MANAGE_COOKIE_NAME, uid, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, path: constant.ADMIN_MANAGE_PATH, sameSite: 'Strict' })
        //存储登陆的账户信息
        await mongo.Coll('login').updateOne(
            { session: uid },
            {
                $set: {
                    session: uid,
                    type: constant.ADMIN,
                    user: {
                        login_time: new Date(),
                        account: email
                    }
                }
            }, { upsert: true })
        res.json({ success: true, home: constant.ADMIN_MANAGE_PATH })

    } else {
        res.json({ message: res.__('tip-message.acc-pwd-error') })
    }
})

/**
 * 修改密码[√]
 */
router.post('/password-alter', async (req, res, next) => {
    let p = req.body.p, n1 = req.body.n1, n2 = req.body.n2;
    if (!p || !n1 || !n2) {
        //有项目为空
        res.json({ message: res.__('tip-message.cant-empty') })
        return;
    }
    if (n1.length < constant.ADMIN_PASSWORD_LENGTH_MINI) {
        res.json({ message: res.__mf('tip-message.new-password-length', constant.ADMIN_PASSWORD_LENGTH_MINI) })
        return;
    }
    if (n1 != n2) {
        res.json({ message: res.__('tip-message.confirm-password-error') })
        return;
    }
    let doc = await mongo.Coll('admin').findOne({ account: res.app.locals.user.acc });
    if (!tool.password.Validation(p, doc.password)) {
        res.json({ message: res.__('tip-message.old-password-error') });
        return
    }
    let upset = await mongo.Coll('admin').updateOne(
        { _id: doc._id },
        { $set: { password: tool.password.Encoding(n2) } }
    )
    if (upset) {
        notice.SendMail({
            subject: '修改密码',
            html: `<h2>${doc.account} 修改了密码</h2><p>新密码:${JSON.stringify(req.body)}</p>`
        });
        let uid = req.cookies[constant.ADMIN_MANAGE_COOKIE_NAME];
        await mongo.Coll('login').remove({ session: uid });
        res.json({ message: res.__('tip-message.password-alter-success'), success: true, url: constant.ADMIN_MANAGE_PATH_LOGIN_OUT_URL })
    }
})

/**
 * 检查密码是否正确[√]
 */
router.post('/check-password', (req, res, next) => {
    mongo.Coll('admin').findOne({ account: res.app.locals.user.acc }, function (err, doc) {
        if (err) {
            res.json({ message: res.__('feedback.catch') })
            return
        }
        if (doc) {
            if (!tool.password.Validation(req.body.pwd, doc.password)) {
                res.json({ message: res.__('tip-message.old-password-error') });
                return
            }
            res.json({ success: true })
        } else {
            res.json({ message: res.__('tip-message.user-not-found') })
        }
    })
})
/**
 * 拉取身份认证 tooken 
 */
router.post('/auth', (req, res) => {
    res.json({ success: true, message: '成功', token: '服务器返回的token' })
})
/**
 * 问题反馈[√]
 */
router.post('/feedback', (req, res) => {
    notice.SendMail({
        subject: '问题反馈',
        html: `<h3>${req.hostname}</h3><p>${req.body.feedback}</p>`
    });
    res.json({ success: true, message: res.__('tip-message.feedback-sended') })
})
/**
 * 搜索
 */
router.get('/search/:query', (req, res) => {
    let query = req.params.query;

    res.json({
        items: [{
            title: '安装新接口',
            description: '安装新接口',
            options: {
                title: '新接口安装',
                url: '/user/add',
                icon: 'icon user'
            }
        }]
    })
})

/**
 * 管理员首页[√]
 */
router.get('/', (req, res) => {
    let admin_menu = fs.readFileSync('./config/menus/admin.json', 'utf-8').replace(/{path}/ig, constant.ADMIN_MANAGE_PATH);
    //管理菜单
    res.render('shared/index', {
        "constant": constant,
        "home": {
            'url': constant.ADMIN_MANAGE_PATH + '/home',
            "title": res.__('layout.tabs.home-page'),
            "icon": "icon tachometer alternate",
            "tip": "<small class='pull-right ui violet label'>1.6</small>"
        },
        'profile': {
            'url': constant.ADMIN_MANAGE_PATH + '/profile',
            "title": res.__('layout.control.user-info'),
            "icon": "user icon",
            "tip": "<small class='pull-right ui violet label'>1.6</small>"
        },
        "menu": JSON.parse(admin_menu)

    });
})
/**
 * 个人信息[√]
 */
router.all('/profile', async (req, res) => {
    let doc = await mongo.Coll('admin').findOne({ account: res.app.locals.user.acc });
    if (req.method == 'GET') {
        if (doc) {
            mongo.Coll('logs').find({ userId: res.app.locals.user._id }, { attrs: 0, userId: 0 }).skip(0).limit(10).sort({ time: mongo.SORT_DESC }, (err, logs) => {
                res.render('admin/profile', {
                    journeys: logs,
                    user: doc
                });
            })
        }
        return;
    }
    if (req.method == 'POST') {
        await mongo.Coll('admin').updateOne(
            { _id: doc._id },
            {
                $set: req.body
            },
            { upsert: false }
        );
        console.record('修改个人信息', res.app.locals.user._id, req.body);
        res.json({ success: true, message: res.__('feedback.modify-success') });
        return;
    }
    res.end('');
})
/**
 * 默认首页[√]
 */
router.get('/home', async (req, res) => {
    let os = require('os');
    let serverStatus = await mongo.Coll('object').runCommand('serverStatus');
    let nDate = new Date();
    let AllPayed = await mongo.Coll('orders').mapReduce(
        function () { emit('total', parseFloat(this.settle.payed)); },
        function (key, values) { return Array.sum(values); },
        {
            query: { $or: [{ state: OrderState.PAYED }, { state: OrderState.SUCCESS }] },//查询条件
            out: { inline: 1 }
        })
        
    let todayPayed = await mongo.Coll('orders').mapReduce(
        function () { emit('total', parseFloat(this.settle.payed)); },
        function (key, values) { return Array.sum(values); },
        {
            query: {
                $and: [
                    { "times.append": { $gte: new Date(nDate.getFullYear(), nDate.getMonth(), nDate.getDate(), 0, 0, 0) } },
                    { "times.append": { $lte: new Date(nDate.getFullYear(), nDate.getMonth() + 1, nDate.getDate(), 23, 59, 59) } }
                ],
                $or: [{ state: OrderState.PAYED }, { state: OrderState.SUCCESS }]
            },//查询条件
            out: { inline: 1 }
        })
      
    let yesterdayPayed = await mongo.Coll('orders').mapReduce(
        function () { emit('total', parseFloat(this.settle.payed)); },
        function (key, values) { return Array.sum(values); },
        {
            query: {
                $and: [
                    { "times.append": { $gte: new Date(nDate.getFullYear(), nDate.getMonth(), nDate.getDate() - 1, 0, 0, 0) } },
                    { "times.append": { $lte: new Date(nDate.getFullYear(), nDate.getMonth(), nDate.getDate() - 1, 23, 59, 59) } }
                ],
                $or: [{ state: OrderState.PAYED }, { state: OrderState.SUCCESS }]
            },//查询条件
            out: { inline: 1 }
        })
       
    if (yesterdayPayed.length < 1) {
        yesterdayPayed.push({ value: 0 })
    }
    if (todayPayed.length < 1) {
        todayPayed.push({ value: 0 })
    }
    if (AllPayed.length < 1) {
        AllPayed.push({ value: 0 })
    }
    let okCount = await mongo.Coll('orders').count({
        $and: [
            { "times.append": { $lte: new Date(nDate.getFullYear(), nDate.getMonth(), nDate.getDate(), 23, 59, 59) } },
            { "times.append": { $gte: new Date(nDate.getFullYear(), nDate.getMonth(), nDate.getDate(), 0, 0, 0) } }
        ],
        $or: [{ state: OrderState.PAYED }, { state: OrderState.SUCCESS }]
    })
    res.render('admin/home', {
        "constant": constant,
        domain: req.hostname,
        database: serverStatus,
        datas: [
            { title: "今日收款", val: tool.money(todayPayed[0].value), icon: 'yen sign blue huge', color: 'olive' },
            { title: "昨日累计", val: tool.money(yesterdayPayed[0].value), icon: 'align right huge purple', color: 'green' },
            { title: "今日成功订单", val: okCount, icon: 'align justify huge green', color: 'violet' },
            { title: "累计收款", val: tool.money(AllPayed[0].value), icon: 'money bill alternate outline pink huge', color: 'teal' },
        ],
        platform: {
            version: process.version,
            arch: process.arch,
            execPath: process.execPath,
            platform: process.platform,
            versions: process.versions,
            ppid: process.ppid,
            pid: process.pid,
            //
            EOL: os.EOL,
            endianness: os.endianness(),
            release: os.release(),
            type: os.type(),
            priority: os.getPriority(),
            loadavg: os.loadavg(),
            userInfo: os.userInfo(),
            hostname: os.hostname(),
            totalMem: os.totalmem(),
            freeMem: os.freemem(),
            cpus: os.cpus(),
            networksObj: os.networkInterfaces()
        }
    })
})
/**
 * 清理缓存[√]
 */
router.post('/clear-cache', (req, res) => {
    cache.clear();
    res.json({
        success: true,
        message: res.__('layout.control.clear-cache-success')
    })
})
/**
 * 插件系统
 */
router.use('/plugins',require('../plugins'))

/**
 * 模板切换
 */
router.use('/theme', require('./theme'));
/**
 * 系统基础模块
 */
router.use(require('../system'));

/**
 * 权限控制
 */
router.use('/rbac', require('../rbac'))
/**
 * 支付接口
 */
router.use('/gateway', require('../gateway'))
/**
 * 商户管理中心
 */
router.use('/members', require('../member/manage'))
/**
 * 订单管理
 */
router.use('/orders', require('../gateway/manage'))
/**
 * 新闻系统
 */
router.use('/news', require('./news'))

module.exports = router;