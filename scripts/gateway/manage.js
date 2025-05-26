/**
 * 订单管理 [后台使用]
 */
const router = require(`express`).Router();
const mongo = require('../../config/database');
const oManage = require('./OrderManage');
const { OrderState } = require('./order');
const _lodash = require('lodash');
let bankNames = require('../apis/bankNames');
const tool = require('../../utils/tool')
/**
 * 收款订单管理[√]
 */
router.all('/order-in', async (req, res) => {
    if (req.method == 'GET') {
        mongo.Coll('gateway').find({}, (err, gateways) => {
            res.render('gateway/order-in', {
                gateways,
                orderState: {
                    "新订单": OrderState.NEW,
                    "付款失败": OrderState.FAILURE,
                    "已付款": OrderState.PAYED,
                    "支付中": OrderState.PAYING,
                    "订单完结": OrderState.SUCCESS,
                    "超时未支付": OrderState.TIMEOUT,
                    "放弃支付": OrderState.WAIVE
                }
            });
        })
    } else {
        let query = {}
        if (req.body['oid']) {//订单号 商户订单号 模糊匹配
            query['$or'] = [{ orderNumber: { $regex: req.body['oid'] } }, { cus_order_id: { $regex: req.body['oid'] } }]
        }
        if (req.body['member']) {//商户账号 商户名称
            query['$or'] = [{ 'member.mbr-account': { $regex: req.body['member'] } }, { 'mbr-name': { $regex: req.body['member'] } }]
        }
        if (req.body['oState'] && '-all-' != req.body['oState']) {//订单状态
            query['state'] = parseInt(req.body['oState'])
        }
        if (req.body['gateway'] && '-all-' != req.body['gateway']) {//支付网关
            query['gateway_type.code'] = req.body['gateway']
        }
        /** 订单汇总 START*/
        let moneyTotal = await mongo.Coll('orders').mapReduce(
            function () {
                try{
                    emit('total', this.settle.order);
                }catch(e){
                    emit('total', 0);
                }
                
            },
            function (key, values) {
                return Array.sum(values);
            },
            {
                query: query,//查询条件
                out: { inline: 1 }
            }
        )
        if (!moneyTotal[0]) {
            moneyTotal[0] = { value: 0 }
        }
        /** 订单汇总 END*/

        let sort = { 'times.append': mongo.SORT_DESC }
        mongo.Coll('orders').find(query, { gateway_type: 1, pay_type: 1, settle: 1, times: 1, orderNumber: 1, state: 1, cus_order_id: 1, cuser: 1 }).sort(sort).skip((parseInt(req.body.pageIndex) - 1) * parseInt(req.body.pageSize)).limit(parseInt(req.body.pageSize), async (err, docs) => {
            res.json({
                datas: docs,
                success: true,
                total: await mongo.Coll('orders').count(query),
                moneyTotal: 888
            })
        })
    }
})

/**
 * 收款订单详情[√]
 */
router.get('/order-in-details', async (req, res) => {
    let order = await mongo.Coll('orders').findOne({ _id: mongo.ObjectId(req.query.did) });
    res.render('gateway/order-in-details', { order: order });
})
/**
 * 处理订单 //TODO:
 * [回调 删除 设置为付款状态]
 */
router.all('/order-in-proc', async (req, res) => {
    if (req.method == 'GET') {
        res.render('gateway/order-in-proc', { data: req.query['did'] });
    } else {
        let oid = req.body['oid'];

        //发送异步回调
        if ('send-notify' == req.body.type) {
            let notifyRes = await oManage.SendNotify(oid, true);
            res.json({ success: notifyRes, message: notifyRes ? "异步通知补发成功" : "异步通知补发失败" });
            return;
        }
        //强制结算 设置为支付成功状态
        if ('made-settlement' == req.body.type) {
            let notifyRes = await oManage.Settlement(oid, true);
            res.json({ success: notifyRes, message: notifyRes ? "结算成功" : "结算失败" });
            return;
        }
        res.json({ message: "失败" })
    }


})

/**
 * 提现订单管理[√]
 */
router.all('/order-out', async (req, res) => {
    if (req.method == 'GET') {
        res.render('gateway/order-out');
    } else {
        //驳回
        if (req.body['type'] == 'rejected') {
            // 提款资金回退
            let cash = await mongo.Coll('cashs').findOne({ _id: mongo.ObjectId(req.body['did']) });

            cash['state'] = '驳回';
            cash['message'] = req.body['info'];

            if (!cash.end) {//没完结订单 才执行资金操作
                cash['end'] = true;
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
                    text: '提现被驳回,资金回退',
                    user: member._id,
                    type: '增加',
                    val: (parseFloat(cash['money']) + parseFloat(cash['draw']['deduction'])),//增加 :  提现资金 + 手续费
                    about: cash.orderId,//关联订单号
                });
            } else {
                res.json({ message: '订单已完结,不可执行操作' });
                return;
            }
            res.json({ success: true, message: '驳回成功' });
            return;
        }
        //同意
        if (req.body['type'] == 'agree') {
            let rst = await mongo.Coll('cashs').updateOne(
                { _id: mongo.ObjectId(req.body['did']), end: { $ne: true } },
                {
                    $set: {
                        state: '完成',
                        message: '转账成功,请注意查收',
                        end: true,
                        'times.payed': new Date()
                    }
                }, { upsert: false }
            )
            if (rst.n < 1) {
                res.json({ message: '订单已完结,不可执行操作' });
                return;
            }
            res.json({ success: true, message: '操作成功' });
            return;
        }

        let pageSize = parseInt(req.body['pageSize']);
        let pageIndex = parseInt(req.body['pageIndex']);
        var query = {};
        mongo.Coll('cashs').find(query).sort({ 'times.append': mongo.SORT_DESC }).skip((pageIndex - 1) * pageSize).limit(pageSize, async (err, docs) => {
            let ids = []
            _lodash(docs).forEach(val => {
                if (!ids.includes(mongo.ObjectId(val['uid']))) {
                    ids.push(mongo.ObjectId(val['uid']))
                }
                try {
                    val.account.bankText = bankNames.getName(val.account.bankName);
                } catch (e) {

                }
            })
            mongo.Coll('member').find({ _id: { $in: ids } }, { 'mbr-name': 1, 'mbr-account': 1 }, async (err, us) => {
                _lodash(docs).forEach(a => {
                    _lodash(us).forEach(b => {
                        if (a['uid'].toString() == b._id.toString()) {
                            a['user'] = b['mbr-name']
                            a['acc'] = b['mbr-account']
                        }
                    })
                })
                res.json({
                    datas: docs,
                    success: true,
                    total: await mongo.Coll('cashs').count(query)
                })
            })

        })
    }
})

/**
 * 订单实时监控
 */
router.all('/order-runing', async (req, res) => {
    if(req.method=='GET'){
        res.render('member/biz_order_run',{});
    }else{
        mongo.Coll('orders').find({}, { gateway_type: 1, pay_type: 1, settle: 1, times: 1, orderNumber: 1, state: 1, cus_order_id: 1, cuser: 1 })
        .sort({_id:mongo.SORT_DESC}).skip(0).limit(10, async (err, docs) => {
            res.json({
                datas: docs,
                success: true,
                total: 0,
                moneyTotal: 0
            })
        })
        
    }
})
module.exports = router;