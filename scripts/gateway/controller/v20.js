const { GATEWAY_MESSAGE, CreateOrderNumber, OrderState } = require('../order');
const path = require('path');
const mongo = require('../../../config/database');
const tool = require('../../../utils/tool');
const _lodash = require('lodash');
const payBase = require('../IPayPort');
const _rat = require('./_rotation');
const _oat = require('./_orders');

module.exports = {
    /**
     * 处理订单
     * @param {Object} _parm 
     * @param {Request} req 
     * @param {Response} res 
     * @param {Function} next 
     */
    async PayOrder(_parm, req, res, next) {
        /**
         * 
         * 
         * 
         * 
         * V20 版本参数验证方案:
         * 
         * 
         * 
         * 
         */

        let trade_money = parseFloat(_parm['trade_money']);

        //#region 基础参数验证
        if (isNaN(trade_money) || trade_money < 0) {
            res.json({ success: false, code: GATEWAY_MESSAGE.MONEY_ERROR });
            return
        }
        if (!_parm['notify_url']) {
            res.json({ success: false, code: GATEWAY_MESSAGE.PARM_LOST, parm: 'notify_url' });
            return;
        }
        if (!_parm['return_url']) {
            res.json({ success: false, code: GATEWAY_MESSAGE.PARM_LOST, parm: 'return_url' });
            return;
        }
        if (!_parm['trade_no']) {
            res.json({ success: false, code: GATEWAY_MESSAGE.PARM_LOST, parm: 'trade_no' });
            return;
        }
        if (!_parm['sign']) {
            res.json({ success: false, code: GATEWAY_MESSAGE.PARM_LOST, parm: 'sign' });
            return;
        }
        //#endregion

        /**
         * 当前商户
         */
        let member = await mongo.Coll('member').findOne({ 'mbr-pid': _parm['pid'] });

        //#region 账户验证
        if (!member) {
            res.json({ success: false, code: GATEWAY_MESSAGE.MEM_PID });
            return;
        }
        //账户已停用
        if (member['mbr-is-use'] != '启用') {
            res.json({ success: false, code: GATEWAY_MESSAGE.MEMBER_USED_OFF });
            return;
        }
        // 账户已过有效期
        
        if (new Date(member['mbr-end-date']) < new Date()) {
            res.json({
                success: false,
                code: GATEWAY_MESSAGE.MEMBER_END_TIME_OFF
            });
            return;
        }
        //api未开通 接入权限
        console.log('ccc',member['mbr-access-used'])
        if (member['mbr-access-used'] != '开通') {
            res.json({ success: false, code: GATEWAY_MESSAGE.ACCESS_API });
            return;
        }

        // 代理账户不能走账
        if (member['mbr-acc-agent-type'] != '普通账户') {
            res.json({ success: false, code: GATEWAY_MESSAGE.AGENT_USER_NOT_PAY });
            return;
        }
        let risk = member['mbr-risk'];
        //是否在使用时间段内
        let useTimeStart = new Date('2000-1-1 '+risk['useTimeStart']+':00'),useTimeEnd=new Date('2000-1-1 '+risk['useTimeEnd']+':00'),nowTime = new Date();
        nowTime = new Date('2000-1-1 '+nowTime.getHours()+':'+nowTime.getMinutes()+':00')
        if(useTimeStart < nowTime && useTimeEnd > nowTime){
            console.log('在交易时间内。')
        }else{
            res.json({ success: false, code: GATEWAY_MESSAGE.TIME_PAY_ERROR });
            return;
        }
        //订单号是否重复[√]
        let order_EXIST = await mongo.Coll('orders').count({ cus_order_id: _parm.trade_no, member_pid: member['mbr-pid'] });
        if (order_EXIST > 0) {
            res.json({ success: false, code: GATEWAY_MESSAGE.ORDER_EXIST });
            return;
        }

        //#endregion

        //支付方式
        let payType = undefined;
        
        //支付代码
        risk['charges'].forEach(element => {
            if (element.code == _parm['action']) {//支付方式
                payType = element;
            }
        });
        if (!payType) {
            res.json({ success: false, code: GATEWAY_MESSAGE.GATEWAY_CODE_ERROR });
            return;
        }
        /**
         * 本系统网关
         */
        let gateway = await mongo.Coll('gateway').findOne({ 'channel-code': payType['code'] }); 
        
        //支付网关是否开启
        if (gateway['channel-used'] != 'true') {
            res.json({ success: false, code: GATEWAY_MESSAGE.GATEWAY_OFF_OFF });
            return;
        }

        // INFO: 单日限额 [单日成功金额达到一定金额时 不再进行支付]
        mongo.Coll('orders').find({
            $or: [{ 'state': OrderState.PAYED }, { 'state': OrderState.SUCCESS }],
            'member._id': member._id,
            'times.append': { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }, { "settle.order": 1, _id: 0 }, async (err, docs) => {
            /**
             * 当日已成功金额
             */
            let day_money = 0;
            _lodash(docs).forEach(val => {
                day_money += parseFloat(val['settle']['order']);
            })
            let post_max_day = (parseFloat(risk['dayMax'])) | 0;//商户 当日限额
            if (day_money > post_max_day) {
                res.json({ success: false, code: GATEWAY_MESSAGE.DAY_PAY_MAX });
                return;
            }
            // INFO: 当日限额判断完成       ::::::::::::::::::::

            // 单笔限额 验证金额是否超出限制
            if (isNaN(parseFloat(payType['chargeMini'])) || isNaN(parseFloat(payType['chargeMax'])) || trade_money < parseFloat(payType['chargeMini']) || trade_money > parseFloat(payType['chargeMax'])) {
                res.json({ success: false, code: GATEWAY_MESSAGE.MONEY_OUT_OFF, message: `最小:${payType['chargeMini']},最大:${payType['chargeMax']}` });
                return;
            }

            /**
             * 验证签名
             */
            //签名方式:`{pid}{trade_no}{notify_url}{return_url}{action}{bankcode}{uid}{trade_money}&{请求签名KEY}`;
            let md5 = `${member['mbr-pid']}${_parm.trade_no}${_parm.notify_url}${_parm.return_url}${_parm.action}${_parm.bankcode}${_parm.uid}${_parm.trade_money}&${member['mbr-sign-key']}`;
            console.pay('ser:md5', md5)
            let mySign = tool.md5(md5);
            console.pay('mysign:', mySign.toLowerCase(), 'sign:', _parm['sign'])
            if (mySign.toLowerCase() != _parm['sign'].toLowerCase()) {
                res.json({ success: false, code: GATEWAY_MESSAGE.SIGN_ERROR });
                return;
            }

            /**
             * 渠道轮换规则
             * [多版本可重复利用]
             */
            let channelTemp = await _rat.rotation(gateway['trunType'], gateway,trade_money);

            let channel = await mongo.Coll('channels').findOne({ 'Away': channelTemp['gateway'], gName: channelTemp['gName'] });
            if (!channel) {
                res.json({ success: false, code: GATEWAY_MESSAGE.CHANNEL_OFF_OFF });
                return;
            }
            // 查找对应的渠道编码
            let chGateway = undefined;
            _lodash(channel['Gateways']).forEach(val => {
                if (val.Gateway == channelTemp['channel']) {
                    chGateway = val;
                }
            });
            if (!chGateway) {
                res.json({ success: false, code: GATEWAY_MESSAGE.CHANNEL_OFF_OFF });
                return;
            }

            let orderNumber = await CreateOrderNumber();//订单号

            //#region 调用接口 生成表单 发起支付
            try {
                //删除模块,避免代码更新后,调用缓存的情况
                delete require.cache[path.resolve(channel['path'])];
            } catch (e) {
                console.log('清理支付接口缓存', e);
            }
            //引入模块
            let appCode = require(path.resolve(channel['path']));
            //初始化 传递参数
            appCode.Init(channel.Args);
            /* 订单号 金额 订单标题 描述 支付代码 req:请求体 */
            let buildResults = await appCode.Build(orderNumber, trade_money, _parm['title'], _parm['title'], chGateway['Gateway'], req);
            if (!buildResults.IsSuccess) {
                res.json({ success: false, code: GATEWAY_MESSAGE.BUILD_RESULTS_ERROR, message: buildResults.Html });
                return;
            }
            //#endregion

            /************** 生产表单成功 *******************************/
            let order = await _oat.SaveOrder({
                _parm,
                orderNumber,
                trade_money,
                member,
                chGateway,
                gateway,
                payType,
                channel,
                risk,
                buildResults
            });
            /**
             * 订单生成[OK]
             */
            if (order) {
                res.json({
                    success: true,
                    code: GATEWAY_MESSAGE.SUCCESS,
                    request: {
                        url: `${req.protocol}://${req.headers.host}/pay/trun/${order.orderNumber}`,
                        type: 'get',
                    }
                });
                return;
            }
        })
    }
}