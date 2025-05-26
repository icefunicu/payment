/**
 * 商户管理中心[后台使用]
 */

const router = require(`express`).Router();
const mongo = require('../../config/database');
const tool = require('../../utils/tool');
const pdf = require('../../utils/pdfFile');
const bNames = require('../apis/bankNames');
const fs = require('fs');
const _lodash = require('lodash');
/**
 * 商户管理[√]
 */
router.all('/manages', (req, res) => {
    if (req.method == 'GET') {
        res.render('member/manager', {});
    } else {
        let query = {}
        if (req.body['keyd']) {
            query['$or'] = [
                { 'mbr-account': { $regex: req.body['keyd'] } },
                { 'mbr-name': { $regex: req.body['keyd'] } },
                { 'mbr-pid': { $regex: req.body['keyd'] } },
                { 'mbr-phone': { $regex: req.body['keyd'] } },
                { 'mbr-qq': { $regex: req.body['keyd'] } },
                { 'mbr-web-site': { $regex: req.body['keyd'] } },
                { 'mbr-web-url': { $regex: req.body['keyd'] } },
            ]
        }
        let sort = { add_time: mongo.SORT_DESC }
        let pageSize = parseInt(req.body['pageSize']);
        let pageIndex = parseInt(req.body['pageIndex']);
        mongo.Coll('member').find(query).skip((pageIndex - 1) * pageSize).limit(pageSize).sort(sort, async (err, docs) => {
            // 查询用户代理
            let agencys = []
            _lodash(docs).forEach(val => {
                if (val.agency && val.agency.oid && !agencys.includes(val.agency.oid)) {
                    agencys.push(val.agency.oid)
                }
            })
            mongo.Coll('member').find({ _id: { $in: agencys } }, { 'mbr-name': 1 }, async (e, v) => {
                _lodash(docs).forEach(val => {
                    _lodash(v).forEach(d => {
                        if (val.agency && val.agency.oid.toString() == d._id.toString()) {
                            val.agency.text = d['mbr-name']
                        }
                    })

                })
                //输出带有 代理信息 的数据
                res.json({
                    success: true,
                    datas: docs,
                    total: await mongo.Coll('member').count(query)
                })
            })

        })

    }
})

/**
 * 商户开户[√]
 */
router.all('/append', async (req, res) => {
    if (req.method == 'GET') {
        mongo.Coll('member').find({ 'mbr-acc-agent-type': "代理账户" }, async (err, docs) => {
            docs.splice(0, 0, { _id: '-null-', 'mbr-name': '不指定代理商' });
            let data = await mongo.Coll('member').findOne({ _id: mongo.ObjectId(req.query.did) });
            //未前台设置数据
            if(!data){data={agency:{oid:'-null-'}}}else if(data&&!data['agency']){data['agency']={oid:'-null-'}}
            res.render('member/append', {
                query: req.query,
                data,
                agUser: docs
            });
        })

    } else {
        delete req.body['_r']
        if (req.body.data_edit == 'edit') {//编辑
            let did = req.body['data-id'];//数据ID
            delete req.body['data_edit'];//移除 控制项
            delete req.body['data-id'];//移除控制项
            req.body['update_time'] = new Date();//最后修改时间
            /**
             * 修改代理商
             */
            //先 置空
            req.body['agency'] = null;
            if (req.body['mbr-pid-pid'] != '-null-') {//选择了代理
                let ag_user = await mongo.Coll('member').findOne({ _id: mongo.ObjectId(req.body['mbr-pid-pid']) });
                if (ag_user && ag_user['mbr-acc-agent-type']=="代理账户" && did != req.body['mbr-pid-pid'] ) {//代理有数据 且为代理商账户 且不能为自己
                    //有正常数值才赋值
                    req.body['agency'] = {
                        oid: ag_user._id,//_id
                        text: ag_user['mbr-name']
                    }
                }
            }
            delete req.body['mbr-pid-pid'];//删除多余数据
            //修改代理完成

            await mongo.Coll('member').updateOne(
                { _id: mongo.ObjectId(did) },//根据_id修改数据
                {
                    $set: req.body
                },
                { upsert: true })
            res.json({ success: true, message: res.__('tip-message.alter-success') });

        } else {//添加
            req.body['mbr-pid'] = tool.random(3, 10);//api id
            req.body['mbr-sign-key'] = tool.random(3, 24);//api key
            //密码加密
            req.body['mbr-password'] = tool.password.Encoding2(req.body['mbr-password']);
            req.body['mbr-pay-code'] = tool.password.Encoding3('123456');
            req.body['mbr-risk'] = {
                //风控基础信息
                dayMax: "500000",
                useTimeStart: "00:00",
                useTimeEnd: "23:00",
                frequency: 'T0',
                draw_max_one: '10000',
                draw_max_day: '50000'

            };
            //指定代理
            if (req.body['mbr-pid-pid'] != '-null-') {//选择了代理
                let ag_user = await mongo.Coll('member').findOne({ _id: mongo.ObjectId(req.body['mbr-pid-pid']) });
                if (ag_user && ag_user['mbr-acc-agent-type']=="代理账户") {//代理有数据 且为代理商账户
                    req.body['agency'] = {
                        oid: ag_user._id,//_id
                        text: ag_user['mbr-name']
                    }
                }
            }
            delete req.body['mbr-pid-pid'];
            //指定代理商结束
            
            await mongo.Coll('member').updateOne(
                { 'mbr-account': req.body['mbr-account'] },
                {
                    $setOnInsert: { add_time: new Date() },
                    $set: req.body
                },
                { upsert: true })
            res.json({ success: true, message: res.__('tip-message.alter-success') });
        }
    }
});
/**
 * 商户开户通知[√]
 */
router.get('/acc-notic', async (req, res) => {
    let member = await mongo.Coll('member').findOne({ _id: mongo.ObjectId(req.query['did']) });
    let file_path = pdf.outAccountLetter(req, member);
    res.header('Content-Type', 'application/pdf').header('Content-Disposition', 'attachment; filename=' + encodeURI('开户信').toString('gkb') + '.pdf');
    res.sendFile(file_path, a => {
        fs.unlinkSync(file_path);
    });

});
/**
 * 重置密码[√]
 */
router.all('/ret-password', async (req, res) => {
    if (req.method == 'GET') {
        res.render('member/ret-password', { query: req.query });
    } else {
        let new_pwd = tool.random(4, 10);
        let doc;
        switch (req.body.rest) {
            case 'login'://登录密码
                doc = await mongo.Coll('member').updateOne(
                    { _id: mongo.ObjectId(req.body.user) },
                    {
                        $set: { 'mbr-password': tool.password.Encoding2(new_pwd) }
                    },
                    { upsert: false })
                res.json({ success: true, message: res.__('tip-message.alter-success'), new_pwd });
                break;
            case 'pay'://提现密码
                new_pwd = _lodash.random(212345, 761234);// tool.randomNum(212345, 761234);
                doc = await mongo.Coll('member').updateOne(
                    { _id: mongo.ObjectId(req.body.user) },
                    {
                        $set: { 'mbr-pay-code': tool.password.Encoding3(new_pwd) }//提现密码
                    },
                    { upsert: false })
                res.json({ success: true, message: res.__('tip-message.alter-success'), new_pwd });
                break;
            default:
                res.json({ success: false, message: 'no command' });
                break
        }

    }
})
/**
 * 商户风控[√]
 */
router.all('/risk-auth', async (req, res) => {
    if (req.method == 'GET') {
        mongo.Coll('gateway').find({}).sort({ 'pay-code': mongo.SORT_DESC }, async (err, docs) => {
            res.render('member/risk-auth', {
                query: req.query,
                gateways: docs,
                user: await mongo.Coll('member').findOne({ _id: mongo.ObjectId(req.query['did']) }, { 'mbr-risk': 1 })
            });
        })
    } else {
        //所有渠道 编码
        mongo.Coll('gateway').find({}, { 'channel-code': 1 }, async (err, docs) => {
            let charges = []//开通的渠道
            _lodash(docs).forEach(val => {
                let charge = req.body[`merchant-charge-${val['channel-code']}`];//商户费率
                let chargeMini = req.body[`merchant-charge-mini-${val['channel-code']}`];//单笔最小
                let chargeMax = req.body[`merchant-charge-max-${val['channel-code']}`];//单笔最大 pay-types-
                let payType = req.body[`pay-types-${val['channel-code']}`];//单笔最大 is use
                if (payType == 'use') {
                    //渠道代码 费率 单笔最小 单笔最大
                    charges.push({ code: val['channel-code'], charge, chargeMini, chargeMax });
                }
            })
            //更新
            await mongo.Coll('member').updateOne(
                { _id: mongo.ObjectId(req.body['user']) },
                {
                    $set: {
                        'mbr-risk': {
                            //开通的渠道
                            dayMax: req.body['post-max-one'],//单日最大提交
                            //允许使用时间段
                            useTimeStart: req.body['use-time-start'],//起始
                            useTimeEnd: req.body['use-time-end'],//结束

                            frequency: req.body['frequency'], //结算周期
                            
                            draw_min_one: req.body['draw-min-one'],//单笔 提款 最小
                            draw_max_one: req.body['draw-max-one'],//单笔 提款 最大
                            draw_max_day: req.body['draw-max-day'],//单日 提款 最大

                            'draw-money-settle': req.body['draw-money-settle'],// 单笔提现手续费
                            'draw-money-max': req.body['draw-money-max'],//单笔提现最大收取手续费金额
                            charges//开通的渠道
                        }
                    }//风控规则
                },
                { upsert: false });
            res.json({ success: true, message: res.__('tip-message.alter-success') });
        })
    }
})
/**
 * 管理提现账户[√]
 */
router.all('/cash-account', async (req, res) => {
    if (req.method == 'GET') {
        res.render('member/mbr-cash')
    } else {
        if (req.body['type'] == 'audit') {
            await mongo.Coll('memberBank').updateOne({ _id: mongo.ObjectId(req.body['did']) }, {
                $set: { accc_state: '正常' }
            }, { upsert: false });
            res.json({ success: true, message: '审核成功' });
            return
        }
        if (req.body['type'] == 'drop') {
            await mongo.Coll('memberBank').updateOne({ _id: mongo.ObjectId(req.body['did']) }, {
                $set: { accc_state: '驳回' }
            }, { upsert: false });
            res.json({ success: true, message: '驳回成功' });
            return
        }

        let query = {}
        if (req.body['acc']) {
            query['mbr-account'] = { $regex: req.body['acc'] };
        }
        let pageSize = parseInt(req.body['pageSize']);
        let pageIndex = parseInt(req.body['pageIndex']);
        mongo.Coll('memberBank').find(query).sort({ add_time: mongo.SORT_DESC }).skip((pageIndex - 1) * pageSize).limit(pageSize, (err, docs) => {
            let uids = []
            _lodash(docs).forEach(val => {
                if (val.accc_type == 'banks') {
                    val.bankName = bNames.getName(val.bankName);
                }
                if (!uids.includes(val.uid)) {
                    uids.push(val.uid);
                }
            })

            mongo.Coll('member').find({ _id: { $in: uids } }, { 'mbr-name': 1 }, async (err, mbs) => {
                _lodash(mbs).forEach(m => {
                    _lodash(docs).forEach(a => {
                        if (a.uid.toString() == m._id.toString()) {
                            a.user = m['mbr-name']
                        }
                    })

                })
                res.json({
                    success: true,
                    datas: docs,
                    total: await mongo.Coll('memberBank').count(query)
                })
            })

        })
    }
})

/**
 * 跑量广告
 */
router.all('/otg-pays', (req, res) => {

    if (req.method == 'GET') {
        res.render('member/oth_pays');
    } else {
        var dts = {
            pType: ['支付宝转账', '微信扫码', '支付宝扫码', '银行卡转账', '手机充值', '支付宝扫码', '支付宝扫码'],
            nick: ['鑫发', '长久游戏', '4668游戏', '4668游戏', '4668游戏'],
            procedure: ['1.5%', '2.7%', '2.5%', '3.2%', '1.9%'],
            state: ['<span class="ui text green">成功</span>', '<span class="ui text green">成功</span>', '<span class="ui text green">成功</span>', '<span class="ui text green">成功</span>', '<span class="ui text ">新订单</span>', '<span class="ui text pink">超时</span>', '<span class="ui text red">未付款</span>'],
            money: [100, 200, 300, 500, 1000, 2000, 200, 300, 100, 200, 300, 500],
        }
        var results = [];
        for (var iii = 0; iii < 15; iii++) {

            results.push({
                orderNumber: 'P-' + tool.random(3, 18).toUpperCase(),
                cus_order_id: tool.random(3, 12).toUpperCase(),
                order: dts.money[Math.floor(Math.random() * dts.money.length)],

                member: dts.nick[Math.floor(Math.random() * dts.nick.length)],
                ateway_type: dts.pType[Math.floor(Math.random() * dts.pType.length)],
                procedure: dts.procedure[Math.floor(Math.random() * dts.procedure.length)],
                state: dts.state[Math.floor(Math.random() * dts.state.length)]
            })
        }

        res.json({
            success: true,
            datas: results,
            total: tool.random(2, 32422),
            moneyTotal: tool.money(tool.random(2, 45672))
        })
    }

})
/**
 * 提现广告
 */
router.all('/otg-tps', (req, res) => {
    if (req.method == 'GET') {
        res.render('member/oth_tps');
    } else {
        var dts = {
            pType: ['支付宝转账', '微信扫码', '支付宝扫码', '银行卡转账', '手机充值', '支付宝扫码', '支付宝扫码'],
            nick: ['鑫发', '长久游戏', '4668游戏', '4668游戏', '4668游戏'],
            procedure: ['1.5%', '2.7%', '2.5%', '3.2%', '1.9%'],
            state: ['<span class="ui text green">成功</span>', '<span class="ui text green">成功</span>', '<span class="ui text green">成功</span>', '<span class="ui text green">成功</span>', '<span class="ui text ">新订单</span>', '<span class="ui text pink">超时</span>', '<span class="ui text red">未付款</span>'],
            money: [1000, 2000, 5000, 10000, 10000, 10000, 20000],
        }
        var results = [];
        for (var iii = 0; iii < 15; iii++) {

            results.push({
                orderNumber: 'OP' + tool.random(3, 18).toUpperCase(),
                cus_order_id: tool.random(3, 12).toUpperCase(),
                order: dts.money[Math.floor(Math.random() * dts.money.length)],

                member: dts.nick[Math.floor(Math.random() * dts.nick.length)],
                ateway_type: dts.pType[Math.floor(Math.random() * dts.pType.length)],
                procedure: dts.procedure[Math.floor(Math.random() * dts.procedure.length)],
                state: dts.state[Math.floor(Math.random() * dts.state.length)]
            })
        }

        res.json({
            success: true,
            datas: results,
            total: tool.random(2, 14523),
            moneyTotal: tool.money(tool.random(2, 45679))
        })
    }
})
module.exports = router;