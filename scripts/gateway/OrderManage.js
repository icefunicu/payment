/**
 * 订单管理[系统使用]
 */
const mongo = require('../../config/database');
const { OrderState } = require('./order');
const { CallBackOrder, CallBackType } = require('./IPayPort');
const constant = require('../../config/constant');
const tool = require('../../utils/tool');
const http = require('../../utils/http');
const { OrderSettleTAG } = require('./order');

/**
 * 订单管理
 */
module.exports = {

    /**
     * 接口验证成功,设置订单未已付款状态
     * 如果成功 则对商户进行结算
     * @param {string} oid 订单号
     * @param {CallBackOrder} _callBackOrder 回调订单给
     */
    async OrderPayed(_callBackOrder) {
        let isOk = await mongo.Coll('orders').updateOne(
            { orderNumber: _callBackOrder.Order, state: OrderState.NEW },
            {
                $set: {
                    state: OrderState.PAYED,
                    'times.payed': new Date(),
                    'settle.payed': parseFloat(_callBackOrder.Money)
                },
                $push: { logs: `${tool.dateFormat(new Date())} 支付成功` }
            },
            { upsert: false });
        console.pay('update:', isOk);
        let rest = { ok: false, send: false };
        if (isOk.ok == 1 && isOk.n > 0) {//成功
            //订单状态设置正确,则需要向下游发送通知
            rest.send = true;
            console.pay('数据修改成功,发送通知:', _callBackOrder.Order)
            //对订单进行结算
            //结算结果记录到数据库
            await this.Settlement(_callBackOrder.Order);
        }
        return rest;
    },
    /**
     * 对订单进行结算,强制执行结算操作
     * @param {string} _orderNumber 订单号
     */
    async Settlement(_orderNumber, mend = false) {

        let order = await mongo.Coll('orders').findOne({ orderNumber: _orderNumber });
        if (!order) {
            console.pay('订单 Settlement ,订单号不存在:', _orderNumber);
            return false;
        }

        console.pay('对订单进行结算:', _orderNumber);

        let settle = order['settle'];//结算信息
        if (settle.settle == OrderSettleTAG) {//是否已经结算?
            //已经结算订单 不再进行操作
            return true;
        } else {
            //设置为已结算
            settle.settle = OrderSettleTAG;
            //资金结算
            settle.profit = parseFloat(settle.order) * parseFloat(settle.procedure) / 100.0;//收取的手续费
            settle.system = (parseFloat(settle.order) * parseFloat(settle.procedure) / 100.0) - (parseFloat(settle.payed) * parseFloat(settle.channel) / 100.0);//系统盈利 = 首先商户手续费(订单总额*商户手续费) - 上游手续费(实际付款*上游手续费)
            settle.member = parseFloat(settle.order) - parseFloat(settle.profit);//商户实际到账金额 = 订单总金额 - 收取的手续费
            //代理结算:
            if (order.agency && settle.agency_charge) {//订单有代理
                settle.agency_procedure = parseFloat(settle.order) * parseFloat(settle.agency_charge) / 100.0;//代理手续费
                settle.agency_profit = parseFloat(settle.order) - settle.agency_procedure;//代理商 实际到账
                settle.agency_money = settle.member - settle.agency_profit;//代理利润(结算时计算) 代理实际获取的资金
                if (settle.agency_money <= 0) {//避免出现负数
                    settle.agency_money = 0;//代理盈利最低为 0 ,
                }

                //代理资金变更
                let agt_cashs = await mongo.Coll('member').findOne({ _id: order['agency']._id }, { cashs: 1 });
                if (!agt_cashs['cashs']) {
                    agt_cashs['cashs'] = { total: 0 }
                }
                await mongo.Coll('member').updateOne({ _id: agt_cashs._id }, {
                    $set: { 'cashs.total': parseFloat(agt_cashs['cashs']['total']) + parseFloat(settle.agency_money) }
                })

                /**
                 * 代理 - 资金日志表
                 */
                await mongo.Coll('cashsLogs').save({
                    add: new Date(),
                    user: order['agency']._id,
                    name: order['agency']['mbr-name'],//名称
                    account: order['agency']['mbr-account'],//账户
                    text: '订单结算 - 代理分润',
                    val: settle.agency_money,//资金额
                    'type': '增加',
                    order: order._id,
                    oid: order['orderNumber'],
                    cid: order['cus_order_id'],

                    time: new Date()
                });
                console.pay('代理分润成功:', settle.agency_money);
            }


            let oSettle = {
                settle: settle,
                state: order['state'],
            }
            if (order['state'] == OrderState.NEW || order['state'] == OrderState.PAYING || order['state'] == OrderState.TIMEOUT || order['state'] == OrderState.WAIVE) {
                order['state'] = OrderState.PAYED;
            }
            //手动强制结算?
            if (mend) {
                oSettle['times.payed'] = new Date();//手动结算
            }
            oSettle['state'] = order['state']; 
            /** 资金增加到商户账户 */
            let mbr = await mongo.Coll('member').findOne({ _id: order['member']._id }, { 'cashs.total': 1 });
            if (!mbr['cashs']) {
                mbr['cashs'] = { total: 0 }
            }
            await mongo.Coll('member').updateOne({ _id: order['member']._id }, {
                $set: { 'cashs.total': parseFloat(mbr['cashs']['total']) + parseFloat(settle.member) }
            })
            console.pay('增加资金:', mbr['cashs']);
            /**
             * 资金日志表
             */
            await mongo.Coll('cashsLogs').save({
                add: new Date(),
                user: order['member']._id,
                name: order['member']['mbr-name'],//名称
                account: order['member']['mbr-account'],//账户
                text: '订单结算 - 增加资金',
                val: settle.member,//资金额
                'type': '增加',
                order: order._id,
                oid: order['orderNumber'],
                cid: order['cus_order_id'],

                time: new Date()
            });


            //更新订单信息
            await mongo.Coll('orders').updateOne(
                { _id: order._id },
                {
                    $set: oSettle,
                    $push: { logs: `${tool.dateFormat(new Date())} 结算成功${mend ? "(手动结算)" : ""}` }
                },
                { upsert: false }
            );
        }

        return true
    },
    /**
     * 发送一次异步通知!
     * @param {string} _orderNumber 订单号
     */
    async SendNotify(_orderNumber, mend = false) {
        console.log('发送通知:', _orderNumber)
        let order = await mongo.Coll('orders').findOne({ orderNumber: _orderNumber });

        if (!order) {
            console.pay('订单 SendNotify ,订单号不存在:', _orderNumber);
            return false;
        }
        //判定发送过多少次,最大发送x次,
        if (order['NotifyCount'] >= constant.NOTIDY_POST_COUNT) {
            console.pay(`达到最大异步通知次数:${constant.NOTIDY_POST_COUNT}`);

            await mongo.Coll('orders').updateOne(
                { _id: order._id },
                {
                    $push: {
                        logs: `${tool.dateFormat(new Date())} 达最大通知次数,不再进行回调`,
                    }
                },
                { upsert: false }
            );
            return true;
        }
        if (!order['NotifyCount']) {
            order['NotifyCount'] = 0;
        }
        let parm = this.BuildParms(order, CallBackType.Asyn);
        // post 数据
        let mbrMessage = await http.post(order['notify'].url_notify, parm);

        //商户返回信息
        parm.backurl = order['notify'].url_notify;
        parm.backStatus = mbrMessage.status
        parm.backMsg = mbrMessage.data;
        if (parm.backMsg == constant.NOTIDY_SUCCESS_STRING) {
            order['state'] = OrderState.SUCCESS;
        }
        let setOrder = { NotifyCount: order['NotifyCount'] + 1, state: order['state'] };
        if (parm.backMsg == constant.NOTIDY_SUCCESS_STRING && !mend) {//成功 且 非手动
            setOrder['times.notify'] = new Date();// 收到通知时间
        }
        //更新订单信息
        await mongo.Coll('orders').updateOne(
            { _id: order._id },
            {
                $set: setOrder,
                $push: {
                    logs: `${tool.dateFormat(new Date())} 发送异步通知${mend ? "(手动补发)" : ""} [返回值:${mbrMessage.data}]`,
                    NotifyResults: parm
                }
            },
            { upsert: false }
        );
        console.log('回调返回值:', mbrMessage.data);
        return true
    },
    /**
     * 构建回调通知参数
     * @param {any} order 订单
     * @param {CallBackType} _callBackType 回调类型
     * @returns 
     */
    BuildParms(order, _callBackType) {
        let parm = {
            status: order['state'],//当前订单状态
            order: order['cus_order_id'],           //商户订单号
            money: order['settle']['order'],        //订单金额(提交金额 不是付款金额)
            paytime: tool.dateFormat(order['times']['payed'], 'yyyy/MM/dd hh:mm:ss'),       //支付时间
            type: (_callBackType == CallBackType.Asyn ? 'notify' : 'callback'), //通知类型
            uid: order['parms']['uid'],             //uid
            args: order['parms']['args'],           //args 自定义参数
            time: new Date().getTime(),             //当前时间戳
            sign: '',

        };
        let signK = '';
        try {
            signK = order['member']['mbr-sign-key'];
        } catch (e) {

        }
        let md5 = `order=${parm.order}&time=${parm.time}&money=${parm.money}&type=${parm.type}&uid=${parm.uid}&paytime=${parm.paytime}&status=${parm.status}#KEY=${signK}`;
        parm.sign = tool.md5(md5);
        console.log('回调参数:', tool.stringify(parm));
        return parm;
    },
    /**
     * 同步回调跳转
     * @param {Response} res 
     */
    async CallBack(_orderNumber) {
        return new Promise(async (r, j) => {
            let order = await mongo.Coll('orders').findOne({ orderNumber: _orderNumber });
            if (!order) {
                console.pay('订单 SendNotify ,订单号不存在:', _orderNumber);
                j('订单不存在')
            }
            let parm = this.BuildParms(order, CallBackType.Sync);
            r(`${order['notify'].url_back}?${tool.stringify(parm)}`);
        })

    }
}