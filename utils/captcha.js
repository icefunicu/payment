/**
 * 图形验证码
 * 存储在session中
 */

var svgCaptcha = require('svg-captcha');
const {StartModel} = require('../config/constant');

module.exports = {
    /**
     * 显示验证码
     * @param {Request} req
     * @param {Response} res
     * @param {Function} next
     */
    show(req, res, next) {
        var captcha = svgCaptcha.create({
            background: '#bbb',
            color: true,
            noise: 5,
            size: process.env.NODE_ENV == StartModel.PRODUCTION ? 4 : 1,
            ignoreChars: '0oiI1lLzvu',
            fontSize: 40
        });
        req.session['captcha'] = captcha.text;
        //生产一个验证码
        //res.json({ code: 200, src: captcha.data })
        res.type('svg');
        res.status(200).send(captcha.data);
    },
    /**
     * 判定验证码是否正确
     * @param {Request} req 
     * @param {String} code 
     * @returns 
     */
    Validation(req, code) {
        if (req.session && req.session['captcha'] && code) {
            var res = (req.session['captcha']).toString().toLocaleLowerCase() == code.toString().toLocaleLowerCase();
            if (res) {
                //验证成功后 删除session数据
                delete req.session.captcha
            }
            return res;
        }
        return false
    }
}