/**
 * 日志处理程序
 * 
 * 已添加到应用程序中.
 * 直接使用 console.log 即可
 * 调试环境下 输出到控制台 生产环境下输出到文件
 */

const log4js = require('log4js');
//log4js.configure('./config/log4js.json');
log4js.configure(require('../config/log4js'));
const app = log4js.getLogger('application')
const error = log4js.getLogger('errors')
const pay = log4js.getLogger('paymeny')
const {StartModel} = require('../config/constant');


/**
 * 记录到数据库
 */
const mongo = require('../config/database');


module.exports = {
    /**
     * 记录 用户操作记录
     * @param {string} msg 日志信息
     * @param {ObjectID} objectId mangoDB 数据库ID(哪个用户产生的)
     * @param  {...any} args 参数
     */
    record(msg, objectId, ...args) {
        mongo.Coll('logs').save({
            message: msg,
            time: Date.now(),
            userId: objectId,
            attrs: args
        })
    },

    /**
     * 消息日志
     * @param {string} msg 信息
     * @param  {...any} args 自定义参数
     */
    info(msg, ...args) {
        
        app.info(msg, ...args)
    },
    /**
     * 警告日志
     * @param {string} msg 信息
     * @param  {...any} args 自定义参数
     */
    warn(msg, ...args) {
        app.warn(msg, ...args)
    },
    /**
     * 调试日志
     * @param {string} msg 信息
     * @param  {...any} args 自定义参数
     */
    debug(msg, ...args) {
        app.debug(msg, ...args)
    },
    /**
     * 跟踪
     * @param {string} msg 信息
     * @param  {...any} args 自定义参数
     */
    trace(msg, ...args) {
        app.trace(msg, ...args)
    },


    /**
     * 失败日志
     * @param {string} msg 信息
     * @param  {...any} args 自定义参数
     */
    fatal(msg, ...args) {
        error.fatal(msg, ...args)
    },
    /**
     * 错误日志
     * @param {string} msg 信息
     * @param  {...any} args 自定义参数
     */
    error(msg, ...args) {
        error.error(msg, ...args)
    },


    /**
     * 支付系统专用
     * @param {string} msg 信息
     * @param  {...any} args 自定义参数
     */
    pay(msg, ...args) {
        pay.trace(msg, ...args)
    },

    /**
     * 记录所有HTTP请求
     */
    httpLogger(req, res, next) {
        let logger = log4js.connectLogger(log4js.getLogger("http-console"));
        if (process.env.NODE_ENV == StartModel.PRODUCTION) {
            logger = log4js.connectLogger(log4js.getLogger("http"));
        }
        return logger(req, res, next);
    }
}

