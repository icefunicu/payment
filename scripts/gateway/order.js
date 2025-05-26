/**
 * 订单系统 [后台使用]
 */

const mongo = require('../../config/database');
const tool = require('../../utils/tool');
const _lodash = require('lodash');

/**
 * 后台管理员使用
 */
module.exports = {
    /**
     * 标识  - 订单是否结算 
     */
    OrderSettleTAG: 'yes',
    /**
     * 订单状态
     */
    OrderState: {
        /**
         * 新生成
         */
        NEW: 0,
        /**
         * 正在支付
         */
        PAYING: 1,
        /**
         * 支付完成 [回调通知中.]
         * 仅支付成功,暂未通知
         */
        PAYED: 2,
        /**
         * 通知成功
         */
        SUCCESS: 4,
        /**
         * 通知失败
         */
        FAILURE: 8,
        /**
         * 放弃支付
         */
        WAIVE: 16,
        /**
         * 超时未支付
         */
        TIMEOUT: 32
    },
    /**
     * 接口错误提示
     */
    GATEWAY_MESSAGE: {
        /**操作成功 */
        SUCCESS:0,
        /**缺少参数 */
        PARM_EMPTY: 6000,
        /**参数有错误 */
        PARM_ERROR: 6001,
        /**PID 错误 */
        MEM_PID: 6002,
        /**签名错误 */
        SIGN_ERROR: 6003,
        /**支付方式未开通 */
        PAY_TYPE_NOT_USE: 6004,
        /**订单号重复 */
        ORDER_EXIST: 6005,
        /**已过有效期 */
        MEMBER_END_TIME_OFF: 6006,
        /** 账户已停用 */
        MEMBER_USED_OFF: 6007,
        /** 版本号错误 */
        VERSION_ERROR: 6008,
        /** api 接口未开通 */
        ACCESS_API: 6009,
        /** 代理账户不允许走量 */
        AGENT_USER_NOT_PAY: 6010,
        /** 网关维护中 */
        GATEWAY_OFF_OFF: 6011,
        /** 金额不正确 */
        MONEY_ERROR: 6012,
        /** 金额超出限制 */
        MONEY_OUT_OFF: 6013,
        /** 渠道维护中 */
        CHANNEL_OFF_OFF: 6014,
        /**生产表单错误 */
        BUILD_RESULTS_ERROR: 6015,
        /**支付代码错误 */
        GATEWAY_CODE_ERROR: 6016,
        /**缺少参数 */
        PARM_LOST: 6017,
        /**达到单日最大收款额度 */
        DAY_PAY_MAX: 6018,
        /**交易时间不在允许范围内  */
        TIME_PAY_ERROR:6019,
    },
    /**
     * 生产系统订单号
     * 已验证数据库,订单号不重复
     */
    async CreateOrderNumber() {
        let config = await mongo.Coll('config').findOne({});
        let order = '';
        //BUG:生成订单号 递归不正确
        async function newOrder() {
            order = config['sys-order-prefix']
            let len = parseInt(config['sys-order-lenght']);
            if (isNaN(len)) {
                len = 16;
            }
            switch (config['sys-order-type']) {

                case '字母数字组合':
                    order += tool.random(3, 14);
                    break;
                case '当前日期时间':
                    order += tool.dateFormat(new Date(), 'yyyyMMddhhmmss')
                    break;
                case '当前日期时间+随机数':
                    order += tool.dateFormat(new Date(), 'yyyyMMddhhmmss') + _lodash.random(1234567, 2345678, false).toString();
                    break;
                case '当前日期时间+随机字符':
                    order += tool.dateFormat(new Date(), 'yyyyMMddhhmmss') + tool.random(3, 14);
                    break;
                case 'GUID':
                    order += tool.guid(4).replace(/-/gi, '');
                    break;
                case '纯数字':
                default:
                    order += _lodash.random(111123456789, 12397654321, false).toString();
                    break;
            }
            if (order.length < len) {
                order += _lodash.random(111123456789, 12397654321, false).toString();
            }
            if (await mongo.Coll('orders').count({ orderNumber: order.slice(0, len) }) > 0) {
                //有则重新生成:
                await newOrder();
            }
            order = order.slice(0, len);
        }
        //尝试生成订单号
        await newOrder();

        return order;
    }
};