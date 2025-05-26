/**
 * /cgi-bin/?
 */
const router = require(`express`).Router();
const fs = require('fs');
const path = require('path');
const tool = require('./tool');

/**
 * 读取语言文件[前台js语言]
 */
router.get('/i18n/:lang', (req, res) => {
    let locale = JSON.parse(fs.readFileSync(path.resolve('./config/locales/pc-' + res.locale + '.json')));
    res.send(`var lang=${JSON.stringify(locale[req.params.lang])}`);
})
/**
 * 图形验证码
 */
router.get('/captcha', function (req, res, next) {
    let captcha = require('./captcha')
    captcha.show(req, res, next);
})
/**
 * 二维码
 */
router.get('/qr-data', function (req, res) {
    let qrImg = require('./qr-image');
    try {
        var b64 = require('js-base64')
        let data = b64.Base64.decode(req.query.data);
        qrImg.encode(data, res)
    } catch (e) {
        // 无法解析数据 返回固定字符串
        qrImg.encode('salsnet 2013-' + new Date().getFullYear(), res)
    }
})

/**
 * 获取天气
 */
router.get('/weather',(req,res)=>{

})

/**
 * 获取当前时间
 */
router.post('/time-stamp',(req, res) => { 
    tool.getTime().then(v=>{
        res.json(v)
    })
})



module.exports = router;