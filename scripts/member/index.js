/**
 * 商户管理中心[前台客户使用]
 */

const router = require(`express`).Router();
const _ck = require('./login');
const mongo = require('../../config/database');
const tool = require('../../utils/tool');
const constant = require('../../config/constant');
const pdf = require('../../utils/pdfFile');
const _log = require('../../utils/mbrLog');
const fs = require('fs');
const cStore = require('../system/cache-store');
const _lodash = require('lodash');
const { OrderState } = require('../gateway/order');
const _phone = require('../apis/sns_port');
const _api = require('../apis');
/**
 * 所有请求前 过滤
 */
router.get('*', async (req, res, next) => {
    if (!res.app.locals.config) {
        res.app.locals.config = await cStore.getConfig();
    }
    next();
})
/**
 * 用户登陆[√]
 */
router.all('/login', async (req, res) => {
    if (req.method == 'GET') {
        res.render('custom/login');
        return
    }
    //验证码是否正确
    let captcha = require('../../utils/captcha');
    if (!captcha.Validation(req, req.body['user-code'])) {
        res.json({ message: res.__('input.input-captcha-error') });
        return;
    }
    let doc = await mongo.Coll('member').findOne({ 'mbr-account': req.body['user-acc'] });
    if (!doc) {
        res.json({ message: '账户不存在' });
        return
    }

    if (tool.password.Encoding2(req.body['user-pwd']).toLowerCase() != doc['mbr-password'].toLowerCase()) {
        res.json({ message: '账户密码不正确' });
        return
    }

    if (new Date(doc['mbr-end-date']) < new Date()) {
        res.json({ message: '试用期已过,禁止登录!' });
        return;
    }
    await _ck.SaveState(res, doc['mbr-account']);
    _log.Log(doc._id, '登录成功', req);
    res.json({ success: true, home: constant.CUSTOMER_MANAGE_PATH });
})
/**
 * 用户注册[√]
 */
router.all('/register', async (req, res) => {
    if (req.method == 'GET') {
        res.render('custom/register');
        return;
    }
    let cfg = await cStore.getConfig()
    if ('on' != cfg['cus-reg-open']) {
        res.json({ message: '注册功能已关闭!' });
        return;
    }
    //验证码使者正确
    let captcha = require('../../utils/captcha');
    if (!captcha.Validation(req, req.body['user-code'])) {
        res.json({ message: res.__('input.input-captcha-error') });
        return;
    }
    if (!req.body['user-nickname']) {
        res.json({ message: '昵称不能为空' });
        return
    }
    if (!req.body['user-email']) {
        res.json({ message: '邮箱不能为空' });
        return
    }
    if (!req.body['user-pwd'] || !req.body['user-pwd2'] || req.body['user-pwd'] != req.body['user-pwd2']) {
        res.json({ message: '密码不一致' });
        return
    }
    if (req.body['user-pwd'].length < constant.CUSTOMER_PASSWORD_LENGTH_MINI) {
        res.json({ message: `密码最少 ${constant.CUSTOMER_PASSWORD_LENGTH_MINI} 位字符` });
        return
    }
    //
    if (await mongo.Coll('member').count({ 'mbr-name': req.body['user-nickname'] }) > 0) {
        res.json({ message: '昵称已存在' });
        return
    }
    if (await mongo.Coll('member').count({ 'mbr-account': req.body['user-email'] }) > 0) {
        res.json({ message: '账号已存在' });
        return
    }
    /** 注册新用户 */
    let user = Object.assign({}, _ck.USER);
    user['mbr-account'] = req.body['user-email'];
    user['mbr-name'] = req.body['user-nickname'];
    user['mbr-password'] = tool.password.Encoding2(req.body['user-pwd2']);

    await mongo.Coll('member').save(user);
    user.manage = constant.CUSTOMER_MANAGE_PATH;
    //存储到系统
    res.app.locals.customer = user

    await _ck.SaveState(res, user['mbr-account']);
    res.json({ success: true, home: constant.CUSTOMER_MANAGE_PATH });
})
/**
 * 服务条款[√]
 */
router.all('/terms', (req, res) => {
    res.render('custom/terms');
})
/**
 * 用户退出[√]
 */
router.all('/login-out', async (req, res) => {
    await _ck.Level(req, res);
    res.redirect(constant.CUSTOMER_LOGIN_PATH);
})

/**
 * 商户后台首页[√]
 * [已登录状态][可访问状态]
 */
router.all('/', _ck.CheckLogin, async (req, res) => {
    if (req.method == 'GET') {
        let codes = [];
        _lodash(res.app.locals.customer['mbr-risk']['charges']).forEach(val => {
            codes.push(val.code)
        });
        //累计收入
        /** 订单汇总 START*/
        let cache_total = await mongo.Coll('orders').mapReduce(
            function () {
                emit('total', parseFloat(this.settle.member));
            },
            function (key, values) {
                return Array.sum(values);
            },
            {
                query: { 'member._id': res.app.locals.customer._id, $or: [{ state: OrderState.PAYED }, { state: OrderState.SUCCESS }] },//查询条件
                out: { inline: 1 }
            }
        )
        if (!cache_total[0]) {
            cache_total[0] = { value: 0 }
        }
        let cache_today = await mongo.Coll('orders').mapReduce(
            function () {
                emit('total', parseFloat(this.settle.member));
            },
            function (key, values) {
                return Array.sum(values);
            },
            {
                query: {
                    'member._id': res.app.locals.customer._id,
                    $or: [{ state: OrderState.PAYED }, { state: OrderState.SUCCESS }],
                    'times.append': { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0) }

                },//查询条件
                out: { inline: 1 }
            }
        )
        if (!cache_today[0]) {
            cache_today[0] = { value: 0 }
        }
        /** 订单汇总 END*/

        /** 读取公告 */
        mongo.Coll('news').find({ 'type': '公告' }, { title: 1 }).sort({ add: mongo.SORT_DESC }).skip(0).limit(10, async (err, gonggao) => {
            //今日收入
            mongo.Coll('gateway').find({ 'channel-code': { $in: codes } }, (err, docs) => {
                res.render('custom/index', {
                    data: docs,
                    total: cache_total[0].value,
                    today: cache_today[0].value,
                    gonggao
                })
            })
        })



    } else {
        if ('unlock' == req.body['type']) {
            if (await mongo.Coll('member').count({
                _id: res.app.locals.customer._id,
                'mbr-password': tool.password.Encoding2(req.body['pwd'])
            }) > 0) {
                res.json({ success: true })
            } else {
                res.json({ message: '密码不正确!' })
            }
        }
    }
})
/**
 * 个人信息[√]
 */
router.all('/profile', _ck.CheckLogin, async (req, res) => {
    if (req.method == 'GET') {
        res.render('custom/biz_profile');
        return
    } else {
        if ('pay-pwd' == req.body['action']) {//提现密码
            let old_pwd = req.body['password'];//
            let new_pwd = _lodash.random(212345, 761234);//

            let isOk = await mongo.Coll('member').updateOne({ _id: res.app.locals.customer._id, 'mbr-pay-code': tool.password.Encoding3(old_pwd) }, {
                $set: { 'mbr-pay-code': tool.password.Encoding3(new_pwd) }
            }, { upsert: false });

            res.json({ success: isOk.n > 0, message: isOk.n > 0 ? '提现密码重置成功,<br/>新密码为:' + new_pwd : '当前提现密码不正确<br/>如果忘记,可联系管理员重置!' });
            _log.Log(res.app.locals.customer._id, '重置提现密码' + (isOk.n > 0 ? '成功' : '失败'), req, '警告');
            return
        }
        if (req.body['action'] == 'avatar') {
            await mongo.Coll('member').updateOne({ _id: res.app.locals.customer._id }, {
                $set: { avatar: req.body['avatar'] }
            }, { upsert: false });
            res.json({ success: true, message: '头像修改成功' });
            _log.Log(res.app.locals.customer._id, '修改头像', req);
            return
        }

        if (req.body['action'] == 'profile') {
            if (!req.body['mbr-name']) {
                res.json({ message: '昵称不能为空' });
                return;
            }
            delete req.body['action']
            delete req.body['_r']
            await mongo.Coll('member').updateOne({ _id: res.app.locals.customer._id }, {
                $set: req.body
            }, { upsert: false });
            res.json({ success: true, message: '信息更新成功' });
            _log.Log(res.app.locals.customer._id, '修改基础信息', req);
            return
        }
        if (req.body['action'] == 'password') {
            if (!req.body['pwd-old']) {
                res.json({ message: '原密码不能为空' });
                return;
            }
            if (!req.body['pwd1']) {
                res.json({ message: '新密码不能为空' });
                return;
            }
            if (req.body['pwd1'] != req.body['pwd2']) {
                res.json({ message: '两次密码不一致' });
                return;
            }
            if (req.body['pwd1'].length < constant.CUSTOMER_PASSWORD_LENGTH_MINI) {
                res.json({ message: `密码不能小于 ${constant.CUSTOMER_PASSWORD_LENGTH_MINI} 位` });
                return;
            }

            var mediumRegex = new RegExp(`^(?=.{${constant.CUSTOMER_PASSWORD_LENGTH_MINI},})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*\\W).*$`, "g");
            if (mediumRegex.test(req.body['pwd1'])) {
                res.json({ message: `密码强度不足,必须包含:大写字母 小写字母 和数字` });
                return;
            }

            let oldPwd = tool.password.Encoding2(req.body['pwd-old']);
            let nPwd = tool.password.Encoding2(req.body['pwd1']);

            delete req.body['action']
            delete req.body['_r']

            let doc = await mongo.Coll('member').updateOne(
                { _id: res.app.locals.customer._id, 'mbr-password': oldPwd },
                { $set: { "mbr-password": nPwd } },
                { upsert: false }
            );
            if (doc['n'] < 1) {
                res.json({ message: '修改失败,原密码不正确' });
                return;
            }
            _log.Log(res.app.locals.customer._id, '修改密码成功', req);
            await _ck.Level(req, res);
            res.json({ success: true, message: '信息更新成功' });
        }

    }

})
/**
 * 下载开户信[√]
 */
router.get('/letter', _ck.CheckLogin, async (req, res) => {
    let member = await mongo.Coll('member').findOne({ _id: res.app.locals.customer._id });
    let file_path = pdf.outAccountLetter(req, member);
    res.header('Content-Type', 'application/pdf').header('Content-Disposition', 'attachment; filename=' + encodeURI('开户信').toString('gkb') + '.pdf');
    res.sendFile(file_path, a => {
        fs.unlinkSync(file_path);
    });
})
/**
 * 商户提现[√]
 */
router.all('/pay-out', _ck.CheckLogin, async (req, res) => {
    if (req.method == 'GET') {
        mongo.Coll('memberBank').find({ uid: res.app.locals.customer._id, accc_state: '正常' }).sort({ add_time: mongo.SORT_DESC }, (err, docs) => {
            res.render('custom/biz_pay_out', { data: docs });
        })
    } else {
        //处理提现
        if (!req.body['money']) {
            res.json({ message: '请输入提现金额' });
            return;
        }
        let money = parseFloat(req.body['money']);
        if (isNaN(money)) {
            res.json({ message: '金额不正确' });
            return;
        }
        if (!req.body['phone']) {
            res.json({ message: '请输入手机号码' });
            return;
        }
        if (!req.body['email']) {
            res.json({ message: '请输入邮箱地址' });
            return;
        }
        if (!req.body['password']) {
            res.json({ message: '请输入提现密码' });
            return;
        }
        /**
         * 验证用户当前余额
         */
        let member = await mongo.Coll('member').findOne({ _id: res.app.locals.customer._id });
        if (!member) {
            res.json({ message: '请刷新页面后重试' });
            return
        }
        let bank = await mongo.Coll('memberBank').findOne({ uid: member._id, _id: mongo.ObjectId(req.body['account']) });

        if (!bank) {
            res.json({ message: '提现账户不存在,请刷新页面后重试' });
            return;
        }
        if (member['mbr-pay-code'] != tool.password.Encoding3(req.body['password'])) {
            _log.Log(res.app.locals.customer._id, '提现失败,密码错误', req, '警告');
            res.json({ message: '提现密码不正确' });
            return;
        }
        let risk = member['mbr-risk'];
        if (money < risk['draw_min_one']) {
            res.json({ message: `超出单笔最低金额:${tool.money(risk['draw_min_one'])}` });
            return;
        }
        if (money > risk['draw_max_one']) {
            res.json({ message: `超出单笔最大金额${tool.money(risk['draw_max_one'])}` });
            return;
        }
        let drawCharge = risk['draw-money-settle'];//手续费率
        let deduction = ((money * 100) * drawCharge) / 100;//系统扣除金额
        if (deduction > parseFloat(risk['draw-money-max'])) {
            deduction = parseFloat(risk['draw-money-max']);
        }
        let mCashs = member['cashs'];
        let mTotal = parseFloat(mCashs['total']);
        if (mTotal < money) {
            res.json({ message: '余额不足' });
            return;
        }
        if (mTotal < money + deduction) {
            res.json({ message: '余额不足(余额不足以扣除本次手续费)' });
            return;
        }
        //账户资金减少:

        /** 账户可提现余额 - money - deduction > 0 允许提现 */
        let cash = {
            uid: res.app.locals.customer._id,
            orderId: tool.guid(4).replace(/-/gi, ''),
            draw: {
                settle: risk['draw-money-settle'],//提现费率
                deduction,//收取手续费
            },
            money: money,
            phone: req.body['phone'],
            email: req.body['email'],
            account: bank,
            times: {
                append: new Date()
            },
            state: '申请'
        }
        // 账户资金减少
        await mongo.Coll('member').updateOne(
            { _id: member._id },
            {
                $set: { 'cashs.total': mTotal - money - deduction }
            }, { upsert: false });
        // 资金变动日志
        await mongo.Coll('cashsLogs').save({
            add: new Date(),
            text: '自主提现',
            account: res.app.locals.customer['mbr-account'],
            name: res.app.locals.customer['mbr-name'],
            user: member._id,
            type: '减少',
            val: money + deduction,//减少 :  提现资金 + 手续费
            about: cash.orderId,//关联订单号
        });
        //生成提现订单
        await mongo.Coll('cashs').save(cash);
        //操作日志
        _log.Log(res.app.locals.customer._id, '自主提现', req);

        //延时 n 秒后返回结果,模拟与银行通信
        setTimeout(() => {
            //发送通知
            _phone.notify(req.body['phone'], _phone.Template.CASHS);

            res.json({ message: '申请提现成功,请等待银行处理', success: true })
        }, 1000 * 3);

    }
})
/**
 * 商户提现历史记录[√]
 */
router.all('/pay-out-list', _ck.CheckLogin, async (req, res) => {
    if (req.method == 'GET') {
        res.render('custom/biz_out_list')
    } else {
        if ('revo' == req.body['type']) {
            let cash = await mongo.Coll('cashs').findOne({ _id: mongo.ObjectId(req.body['did']) });
            if (cash.end) {
                res.json({ message: '订单已完结,不可操作' });
                return;
            }
            cash['state'] = '撤销';
            cash['message'] = '商户自主撤销';
            cash['end'] = true;
            //资金回退到自己账户余额
            let member = await mongo.Coll('member').findOne({ _id: cash['uid'] });
            if (!member['cashs']) {
                member['cashs'] = { total: 0 }
            }
            if (!member['cashs']['total']) {
                member['cashs']['total'] = 0;
            }
            member['cashs']['total'] = parseFloat(member['cashs']['total']) + (parseFloat(cash['money']) + parseFloat(cash['draw']['deduction']));
            //修改商户余额
            await mongo.Coll('member').updateOne({ _id: member._id }, { $set: { 'cashs.total': member['cashs']['total'] } }, { upsert: false });
            //修改提现订单
            await mongo.Coll('cashs').updateOne({ _id: cash._id }, { $set: cash }, { upsert: false });
            // 商户资金变动日志
            await mongo.Coll('cashsLogs').save({
                add: new Date(),
                name: member['mbr-name'],
                account: member['mbr-account'],
                text: '自主撤销提现订单,资金回退',
                user: member._id,
                type: '增加',
                val: (parseFloat(cash['money']) + parseFloat(cash['draw']['deduction'])),//增加 :  提现资金 + 手续费
                about: cash.orderId,//关联订单号
            });

            _log.Log(res.app.locals.customer._id, '自主撤销提现申请', req);
            //延时发送通知 模拟与银行通信
            setTimeout(() => {
                res.json({ message: '提现申请撤销成功', success: true })
            }, 1200);
            return
        }
        let pageSize = parseInt(req.body.rows);
        let pageIndex = parseInt(req.body.page);
        let query = { uid: res.app.locals.customer._id }
        let total_count = await mongo.Coll('cashs').count(query);
        mongo.Coll('cashs').find(query).sort({ 'times.append': mongo.SORT_DESC }).skip((pageIndex - 1) * pageSize).limit(pageSize, (err, docs) => {
            res.json({
                success: true,

                rows: docs,
                records: total_count,
                total: Math.ceil(total_count / pageSize)
            })
        })
    }
})
/**
 * 添加提现账户 [√]
 */
router.all('/bankcard', _ck.CheckLogin, async (req, res) => {
    if (req.method == 'GET') {
        mongo.Coll('memberBank').find({ uid: res.app.locals.customer._id }).sort({ _id: mongo.SORT_DESC }, (err, docs) => {
            res.render('custom/biz_bankcard', {
                banks: require('../apis/bankNames'),
                data: docs
            })
        })

    } else {
        if (req.body['type'] == 'drop') {
            await mongo.Coll('memberBank').remove({ _id: mongo.ObjectId(req.body['did']) });
            _log.Log(res.app.locals.customer._id, '删除提现账户', req);
            res.json({ message: '删除成功', success: true });
            return;
        }
        if (!req.body['name']) {
            res.json({ message: '请填写收款人姓名' });
            return;
        }
        if (!req.body['idcard']) {
            res.json({ message: '请填写收款身份证号码' });
            return;
        }
        if (!req.body['phone']) {
            res.json({ message: '请填写收款人手机号' });
            return;
        }
        if (!req.body['account']) {
            res.json({ message: '请填写收款账号' });
            return;
        }
        if (req.body['accc_type'] != 'banks') {
            delete req.body['bankName']
        } else {
            if (!_api.isBankCard(req.body['account'])) {
                res.json({ message: '银行卡号不正确' });
                return;
            }
        }
        if (!_api.isPhone(req.body['phone'])) {
            res.json({ message: '手机号格式不正确' });
            return;
        }
        if (!_api.isIdCard(req.body['idcard'])) {
            res.json({ message: '身份证号码不正确' });
            return;
        }
        if (!await _api.BankNameCard(req.body['name'], req.body['phone'], req.body['idcard'], req.body['account'])) {
            res.json({ message: '非本人银行卡,或预留手机号不正确' });
            return;
        }

        switch (req.body['accc_type']) {
            case 'alipay': req.body['accc_type_text'] = '支付宝'; break
            case 'wxpay': req.body['accc_type_text'] = '微信'; break
            case 'banks': req.body['accc_type_text'] = '银行卡'; break
        }
        req.body['add_time'] = new Date();
        req.body['accc_state'] = '待审核';
        delete req.body['_r']
        req.body['uid'] = res.app.locals.customer._id
        await mongo.Coll('memberBank').save(req.body);
        _log.Log(res.app.locals.customer._id, '添加提现账户', req);
        res.json({ success: true, message: '添加成功' });
    }
})
/**
 * 订单管理[√--×]
 * //INFO:暂未完成
 */
router.all('/orders', _ck.CheckLogin, async (req, res) => {
    if (req.method == 'GET') {
        res.render('custom/biz_orders');
    } else {
        let pageSize = parseInt(req.body.rows);
        let pageIndex = parseInt(req.body.page);
        let orderType = req.query['type']
        let query = { 'member._id': res.app.locals.customer._id }
        if (orderType == 'fail') {
            query['$or'] = [{ state: OrderState.WAIVE }, { state: OrderState.TIMEOUT, state: OrderState.PAYING }]
        }
        if (orderType == 'success') {
            query['$or'] = [{ state: OrderState.PAYED }, { state: OrderState.SUCCESS }]
        }
        //
        if (req.body['filters']) {
            let filters = JSON.parse(req.body['filters']);
            let filter = tool.formatQuery(filters.rules, filters.groupOp);
            query = Object.assign(query, filter);
        }


        console.log('查条件:', query)
        let total_count = await mongo.Coll('orders').count(query);
        mongo.Coll('orders').find(query, { gateway_type: 1, pay_type: 1, settle: 1, times: 1, orderNumber: 1, state: 1, cus_order_id: 1 }).sort({ 'times.append': mongo.SORT_DESC }).skip((pageIndex - 1) * pageSize).limit(pageSize, (err, docs) => {
            _lodash(docs).forEach(val => {
                delete val.pay_type.Away
                delete val.pay_type.Version
                delete val.pay_type.gateway

                delete val.settle.draw_charge
                delete val.settle.draw_maxCharge
                delete val.settle.system
                delete val.settle.channel
                delete val.settle.profit

                switch (val.state) {
                    case OrderState.NEW:
                    case OrderState.PAYING:
                    case OrderState.WAIVE:
                        val.state = "未支付";
                        break;

                    case OrderState.FAILURE:
                        val.state = "支付成功-通知失败";
                        break;
                    case OrderState.PAYED:
                        val.state = "支付成功-通知中";
                        break;

                    case OrderState.SUCCESS:
                        val.state = "支付成功-通知成功";
                        break;

                    case OrderState.TIMEOUT:
                        val.state = "超时-未支付";
                        break;
                }
            });

            res.json({
                success: true,
                rows: docs,
                records: total_count,
                total: Math.ceil(total_count / pageSize)
            })
        });
    }
})
/**
 * 查看订单详情[√]
 */
router.get('/order-detail', _ck.CheckLogin, async (req, res) => {
    res.render('custom/biz_order_detail', { data: await mongo.Coll('orders').findOne({ _id: mongo.ObjectId(req.query['did']), 'member._id': res.app.locals.customer._id }) });
})

/**
 * 公告[√]
 */
router.all('/notices', _ck.CheckLogin, async (req, res) => {
    if (req.method == 'GET') {
        res.render('custom/biz_notices');
    } else {
        if ('read' == req.body['type']) {
            let news = await mongo.Coll('news').findOne({ _id: mongo.ObjectId(req.body['did']) }, { _id: 0, user: 0, type: 0 });
            news.add = tool.dateFormat(news.add)
            res.json(news);
            return;
        }
        let pageSize = parseInt(req.body.rows);
        let pageIndex = parseInt(req.body.page);
        let query = { $or: [{ type: '公告' }, { user: res.app.locals.customer._id.toString() }] };
        let total_count = await mongo.Coll('news').count(query);
        mongo.Coll('news').find(query, { html: 0 }).sort({ 'add': mongo.SORT_DESC }).skip((pageIndex - 1) * pageSize).limit(pageSize, (err, docs) => {

            res.json({
                success: true,
                rows: docs,
                records: total_count,
                total: Math.ceil(total_count / pageSize)
            })
        });
    }
})
/**
 * 通知[√]
 */
router.all('/im', _ck.CheckLogin, async (req, res) => {
    res.render('custom/biz_im');
})
/**
 * 操作日志[√]
 */
router.all('/logs', _ck.CheckLogin, async (req, res) => {
    if (req.method == 'GET') {
        res.render('custom/biz_logs')
    } else {
        let pageSize = parseInt(req.body.rows);
        let pageIndex = parseInt(req.body.page);
        let total_count = await mongo.Coll('memberLogs').count({ uid: res.app.locals.customer._id });
        mongo.Coll('memberLogs').find({ uid: res.app.locals.customer._id }).sort({ 'add_time': mongo.SORT_DESC }).skip((pageIndex - 1) * pageSize).limit(pageSize, (err, docs) => {

            res.json({
                success: true,
                rows: docs,
                records: total_count,
                total: Math.ceil(total_count / pageSize)
            })
        });
    }
})
/**
 * 资金变更记录[√]
 */
router.all('/pay-money-log', _ck.CheckLogin, async (req, res) => {
    if (req.method == 'GET') {
        res.render('custom/biz_money_logs')
    } else {
        let pageSize = parseInt(req.body.rows);
        let pageIndex = parseInt(req.body.page);
        let total_count = await mongo.Coll('cashsLogs').count({ user: res.app.locals.customer._id });
        mongo.Coll('cashsLogs').find({ user: res.app.locals.customer._id }).sort({ '_id': mongo.SORT_DESC }).skip((pageIndex - 1) * pageSize).limit(pageSize, (err, docs) => {

            res.json({
                success: true,
                rows: docs,
                records: total_count,
                total: Math.ceil(total_count / pageSize)
            })
        });
    }
})



/**
 * 商户消息中心
 */
router.use('/scoket', _ck.CheckLogin, require('./message'));

//#region 子账号管理
router.use('/child', _ck.CheckLogin, require('./child'));
//#endregion


module.exports = router;