/**
 * 生产表单并入库
 * 
 * 
 */

const { OrderState } = require('../order');
const mongo = require('../../../config/database');
const tool = require('../../../utils/tool');
const _lodash = require('lodash');

module.exports = {

    /**
     * 生成订单并入库
     * @param {object} args 生产订单的参数
     * @returns 订单
     */
    async SaveOrder(args) {
        /**
             * 入库订单
             */
        let order = {
            member:args.member,
            parms: args._parm,                           //商户提交的原始参数
            orderNumber: args.orderNumber,               //订单号
            state: OrderState.NEW,                  //订单状态
            cus_order_money: args.trade_money,           //商户订单金额
            member_pid: args.member['mbr-pid'],          //商户pid
            cus_order_id: args._parm['trade_no'],        //商户订单号
            //支付方式[网关]
            gateway_type: {
                text: args.gateway['channel-name'],      //支付名称
                code: args.gateway['channel-code'],      //支付代码
                charge: args.gateway['channel-charge']   //默认费率
            },
            //支付方式[渠道]
            pay_type: {
                gateway: args.chGateway['Gateway'],      //网关代码
                text: args.chGateway['Text'],            //网关名称
                Away: args.channel.Away,                 //接口网关代码
                Name: args.channel.Name,                 //名称-接口内
                gName: args.channel.gName,               //名称-自定义
                Version: args.channel.Version,           //版本-接口
            },
            notify: {
                url_back: args._parm['return_url'],
                url_notify: args._parm['notify_url']
            },
            //费率
            settle: {
                channel: parseFloat(args.gateway['channel-charge']),     //上游费率
                procedure: parseFloat(args.payType['charge']),           //商户手续费 x%

                profit: parseFloat(0.0),                            //收取商户手续费金额
                system: parseFloat(0.0),                            //系统盈利(扣除上游收取手续费之后金额)
                member: parseFloat(0.0),                            //商户到账金额

                order: args.trade_money,                                 //本单金额
                payed: parseFloat(0.0),                             //实际支付金额,由上游定 实际到账金额

                draw_charge: parseFloat(args.risk['draw-money-settle']), //提现 商户手续费
                draw_maxCharge: parseFloat(args.risk['draw-money-max']), //提现 商户最高收取费率
            },
            times: {
                append: new Date()
            },
            cuser: {
                acc: args.member['mbr-account'],
                name: args.member['mbr-name'],
            },
            /**
             * 订单使用哪种形式展示
             */
            page: args.buildResults,
            channel: args.channel,//上游渠道
            gateway: args.gateway,//本系统网关
            logs: [`${tool.dateFormat(new Date())} 生成订单`]
        }
        //#region 代理
        let agency = args.member['agency'];
        if (agency) {//该商户有代理商
            let agent = await mongo.Coll('member').findOne({ _id: agency.oid });
            let agt_charge = {}
            _lodash(agent['mbr-risk'].charges).forEach(val => {
                if (val['code'] == args.gateway['channel-code']) {
                    agt_charge = val;
                }
            });
            if (agt_charge) {
                order.settle.agency_charge = agt_charge.charge;//代理费率
                order.settle.agency_money = 0;//代理利润(结算时计算)
                order.agency = agent;//该订单的代理商
            } else {
                console.pay(`无法确认代理费率:${agent['mbr-account']},商户:${args.member['mbr-account']}`);
            }
        }
        //#endregion


        //结束时间 [订单有效期  个码产码时有效]
        order.EndTime = new Date().setSeconds(args.gateway['channel-time']);
        console.log('过期时间:', order.EndTime)
        //存入数据库
        await mongo.Coll('orders').save(order);
        return order;
    }
}