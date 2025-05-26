/**
 * 互联网收单处理[前台接口API]
 */

const { GATEWAY_MESSAGE } = require('./order');
const router = require(`express`).Router();
const pOut = require(`./controller/pay_out`);
const mongo = require('../../config/database');
const tool = require('../../utils/tool');
const _lodash = require("lodash");

/**
 * 接口收单
 */
router.all('/order', async (req, res, next) => {
    try {
        let _parm = undefined;
        if (typeof (req.body) == 'object') {
            _parm = req.body;
        }

        if (Object.keys(_parm).length < 1) {
            try {
                _parm = req.params;
            } catch (error) {
                console.pay('无法识别 params', req.params);
            }
        }
        if (Object.keys(_parm).length < 1) {
            try {
                _parm = req.query;
            } catch (error) {
                console.pay('无法识别 query', req.query);
            }
        }
        if (Object.keys(_parm).length < 1) {
            res.json({ success: false, code: GATEWAY_MESSAGE.PARM_ERROR })
            return;
        }
        if (!_parm['version']) {
            res.json({ success: false, code: GATEWAY_MESSAGE.VERSION_ERROR, message: 'example:v10' });
            return
        }
        let coll = require(`./controller/${_parm['version']}`);
        await coll.PayOrder(_parm, req, res, next);
    } catch (e) {
        console.error(e);
        res.json({ success: false, code: GATEWAY_MESSAGE.VERSION_ERROR });

    }
})

/**
 * API 代付接口
 */
router.all('/receipt', async (req, res) => {
    if (req.method != "POST") {
        res.json({ success: false, message: '', code: 8020 })
        return;
    }
    let a = await pOut.Receipt(req.body);
    res.json(a);
})

/**
 * 订单查询接口[√]
 */
router.post('/list', async (req, res) => {

    let arg = {
        pid: req.body['pid'],            //商户id
        trade_no: req.body['trade_no'],  //指定订单号 [优先使用]
        page: parseInt(req.body['page']),          //第几页 [没有订单号时返回 多条,并根据此值返回对应页码]
        sign: req.body['sign']
    }
    if (!arg.sign) {
        res.json({ success: false, code: GATEWAY_MESSAGE.PARM_EMPTY, data: 'sign' });
        return;
    }
    if (!arg.pid) {
        res.json({ success: false, code: GATEWAY_MESSAGE.PARM_EMPTY, data: 'pid' });
        return;
    }

    let member = await mongo.Coll('member').findOne({ 'mbr-pid': arg.pid });
    //#region 账户验证
    if (!member) {
        res.json({ success: false, code: GATEWAY_MESSAGE.MEM_PID });
        return;
    }

    let md5 = `${arg.pid}${arg.trade_no}${arg.page}&${member['mbr-sign-key']}`;
    if (tool.md5(md5).toLocaleLowerCase() != arg.sign.toLocaleLowerCase()) {
        res.json({ success: false, code: GATEWAY_MESSAGE.SIGN_ERROR });
        return;
    }
    function orderFomt(order) {
        return {
            order: order.orderNumber,
            trade_no: order.cus_order_id,
            trade_money: order.parms.trade_money,
            notify_url: order.parms.notify_url,
            return_url: order.parms.return_url,

            gateway_type: order.gateway_type.text,
            gateway_code: order.gateway_type.code,
            state: order.state,
            settle: order.settle.settle,

            bankcode: order.parms.bankcode,
            uid: order.parms.uid,
            title: order.parms.title,
            service: order.parms.service,
            args: order.parms.args,
        }
    }
    if (arg.trade_no) {//指定了订单号
        let data = orderFomt(await mongo.Coll('orders').findOne({ 'cus_order_id': arg.trade_no, 'member.mbr-pid': arg.pid }));
        res.json({ success: true, code: GATEWAY_MESSAGE.SUCCESS, data: [data] });
        return
    } else {
        mongo.Coll('orders').find({ 'member.mbr-pid': arg.pid }).sort({ _id: -1 }).skip(50 * (arg.page - 1)).limit(50, (err, docs) => {
            let data = []
            _lodash(docs).forEach(val => {
                data.push(orderFomt(val));
            })
            res.json({ success: true, code: GATEWAY_MESSAGE.SUCCESS, data });
            return
        })
    }
})

module.exports = router;