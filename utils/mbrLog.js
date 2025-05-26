//
const mongo = require('../config/database');
module.exports = {
    /**
     * 添加商户操作日志
     * @param {ObjectId} uid 商户id
     * @param {string} msg 日志主体
     * @param {Request} req 请求体
     * @param {string} level 日志级别
     */
    Log(uid, msg, req, level = '消息') {
        mongo.Coll('memberLogs').save({
            msg,
            ip: req.socket.remoteAddress,
            level,
            uid,
            add_time: new Date()
        })
    }
}