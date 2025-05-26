/**
 * 子账号管理
 * 商户中心
 */
const router = require(`express`).Router();
const _ck = require('./login');
const mongo = require('../../config/database');
const tool = require('../../utils/tool');
const _log = require('../../utils/mbrLog');
const _lodash = require('lodash');
const { OrderState } = require('../gateway/order');

//INFO: 代理功能 整体模块

/**
 * 开设子账号[√]
 */
router.all('/append', async (req, res) => {
    let mbr = await mongo.Coll('member').findOne({ _id: res.app.locals.customer._id });
    if (req.method == 'GET') {
        if (mbr['mbr-acc-agent-type'] != '代理账户') {
            res.render('custom/child_empty', {});
            return;
        }
        res.render('custom/child_add', {});
        return;
    }

    if (mbr['mbr-acc-agent-type'] != '代理账户') {
        res.json({ message: '您不是代理账户,不能开设子账号' });
        return;
    }
    if (!req.body['mbr-name']) {
        res.json({ message: '昵称不能为空' });
        return;
    }
    if (!req.body['mbr-account']) {
        res.json({ message: '账户不能为空' });
        return;
    }
    if (!(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(req.body['mbr-account']))) {
        res.json({ message: '账户 请使用 邮箱 格式' });
        return;
    }
    if (!req.body['mbr-password']) {
        res.json({ message: '密码不能为空' });
        return;
    }
    if (await mongo.Coll('member').count({ 'mbr-account': req.body['mbr-account'] }) > 0) {
        res.json({ message: '账户已存在,请更换' });
        return;
    }
    if (await mongo.Coll('member').count({ 'mbr-name': req.body['mbr-name'] }) > 0) {
        res.json({ message: '昵称已存在,请更换' });
        return;
    }

    delete req.body['_r'];
    let user = Object.assign({}, _ck.USER);
    user['mbr-account'] = req.body['mbr-account'];
    user['mbr-name'] = req.body['mbr-name'];
    user['mbr-password'] = tool.password.Encoding2(req.body['mbr-password']);

    user['mbr-web-site'] = req.body['mbr-web-site'];
    user['mbr-web-url'] = req.body['mbr-web-url'];

    user['mbr-phone'] = req.body['mbr-phone'];
    user['mbr-qq'] = req.body['mbr-qq'];

    //指定代理
    user['agency'] = {
        oid: res.app.locals.customer._id,
        text: res.app.locals.customer['mbr-name']
    }
    await mongo.Coll('member').save(user);
    console.log("开子账号",user)
    _log.Log(res.app.locals.customer._id, `添加子账号:${req.body['mbr-account']}`, req, '消息');
    res.json({ message: '子账号添加成功', success: true });
})
/**
 * 子账号管理[√]
 */
router.all('/manage', async (req, res) => {
    if (req.method == 'GET') {
        if (res.app.locals.customer['mbr-acc-agent-type'] != '代理账户') {
            res.render('custom/child_empty', {});
            return;
        }
        res.render('custom/child_manage')
        return;
    }

    let pageSize = parseInt(req.body.rows);
    let pageIndex = parseInt(req.body.page);
    let query = { 'agency.oid': res.app.locals.customer._id };

    let total_count = await mongo.Coll('orders').count(query);
    mongo.Coll('member').find(query).sort({ add_time: mongo.SORT_DESC }).skip((pageIndex - 1) * pageSize).limit(pageSize, (err, docs) => {
        res.json({
            "success": true,
            "rows": docs,
            "records": total_count,
            total: Math.ceil(total_count / pageSize)
        })
    })
})
/**
 * 子账号详情[√]
 */
router.all('/child_detail', async (req, res) => {

    if (res.app.locals.customer['mbr-acc-agent-type'] != '代理账户') {
        res.render('custom/child_empty', {});
        return;
    }

    let data = await mongo.Coll('member').findOne({ _id: mongo.ObjectId(req.query['did']) });
    mongo.Coll('gateway').find({}, (err, gateways) => {
        res.render('custom/child_detail', { data, gateways });
    })
})
/**
 * 子账号订单[√]
 */
router.all('/order', (req, res) => {
    if (req.method == 'GET') {
        if (res.app.locals.customer['mbr-acc-agent-type'] != '代理账户') {
            res.render('custom/child_empty', {});
            return;
        }
        res.render('custom/child_orders')
        return;
    }

    mongo.Coll('member').find({ 'agency.oid': res.app.locals.customer._id }, { _id: 1 }, async (err, dids) => {
        let pageSize = parseInt(req.body.rows);
        let pageIndex = parseInt(req.body.page);
        let finds = []
        _lodash(dids).forEach(val => {
            finds.push(val._id);
        })
        let query = { 'member._id': { $in: finds } };
        let total_count = await mongo.Coll('orders').count(query);
        mongo.Coll('orders').find(query, { settle: 1, state: 1, times: 1, orderNumber: 1, cuser: 1, gateway_type: 1, cus_order_id: 1 }).sort({ 'times.append': mongo.SORT_DESC }).skip((pageIndex - 1) * pageSize).limit(pageSize, (err, datas) => {

            _lodash(datas).forEach(val => {
                delete val.pay_type

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
                "success": true,
                "rows": datas,
                "records": total_count,
                "total": Math.ceil(total_count / pageSize)
            })
        })
    });
})
/**
 * 子账号订单详情
 */
router.get('/order_detail', async (req, res) => {
    res.render('custom/biz_order_detail', { data: await mongo.Coll('orders').findOne({ _id: mongo.ObjectId(req.query['did']), 'member.agency.oid': res.app.locals.customer._id }) });
})
/**
 * 子账户渠道配置
 * [数据展示]
 */
router.get('/gateway_config', async (req, res) => {

    if (res.app.locals.customer['mbr-acc-agent-type'] != '代理账户') {
        res.render('custom/child_empty', {});
        return;
    }

    let child = await mongo.Coll('member').findOne({ _id: mongo.ObjectId(req.query.did), 'agency.oid': res.app.locals.customer._id });
    let codes = [];
    _lodash((res.app.locals.customer['mbr-risk']['charges'])).forEach(val => {
        codes.push(val['code'])
    })

    mongo.Coll('gateway').find({ 'channel-code': { $in: codes } }, (err, docs) => {
        res.render('custom/child_gateway_config', {
            child,
            customer: res.app.locals.customer,
            gateways: docs
        })
    })

})
/**
 * 子账户渠道配置
 * [保存数据]
 */
router.post('/gateway_config', async (req, res) => {
    if (res.app.locals.customer['mbr-acc-agent-type'] != '代理账户') {
        res.json({ message: '您没有子账户管理权限', success: true });
        return;
    }
    let mrs =
    {
        dayMax: parseInt(req.body['cf-dayMax']),
        useTimeStart: req.body['useTimeStart'],
        useTimeEnd: req.body['useTimeEnd'],

        frequency: req.body['frequency'],

        'draw_min_one': req.body['draw-min-one'],
        'draw_max_one': req.body['draw-max-one'],
        'draw_max_day': req.body['draw-max-day'],
    }
    let charges = [];
    _lodash(req.body).forEach((val, key) => {
        if (key.toString().startsWith('gay-used-')) {
            let nKey = key.toString().slice('gay-used-'.length);
            let oMax = req.body['ch-max-one-' + nKey];
            let oMin = req.body['ch-min-one-' + nKey];
            let oRate = req.body['ch-rate-' + nKey];
            charges.push({
                code: nKey,
                charge: oRate,
                chargeMini: oMin,
                chargeMax: oMax,
            });
        }
    })
    mrs['charges'] = charges;
    let rest = await mongo.Coll('member').updateOne(
        { _id: mongo.ObjectId(req.query.did) },
        {
            $set: {
                'mbr-access-used': req.body['pay-in-used'] == 'on' ? "开通" : "未开通",
                'mbr-api-pay-use': req.body['pay-out-used'] == 'on' ? "开通" : "未开通",
                'mbr-end-date': req.body['end-date'],

                'mbr-risk': mrs
            }
        }, { upsert: false }
    ) 
    res.json({ message: '渠道配置成功', success: true });
})

module.exports = router;