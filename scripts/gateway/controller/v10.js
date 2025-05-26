const {  GATEWAY_MESSAGE } = require('../order');
module.exports = {
    /**
     * 处理订单
     * @param {Object} _parm 
     * @param {Request} req 
     * @param {Response} res 
     * @param {Function} next 
     */
    PayOrder(_parm, req, res, next) {
        res.json({ success: false, code: GATEWAY_MESSAGE.VERSION_ERROR,message:'use:v20' })
    }
}