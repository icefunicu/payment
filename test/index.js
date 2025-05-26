
/**
 * 系统测试
 * 前台地址：/run-test/?
 */

const router = require(`express`).Router();

const tool = require("../utils/tool");
const mongo = require("../config/database");
const fs = require("fs");
const path = require('path');
const _lodash = require("lodash");
const http = require("../utils/http");

/**
* @param {Request} req 
* @param {Response} res 
 */
router.get('/', async (req, res) => {
    
    mongo.Coll('member').find({}, { 'mbr-pid': 1, 'mbr-name': 1, 'mbr-account': 1 }).sort({_id:mongo.SORT_DESC}, (err, members) => {
        mongo.Coll('gateway').find({}, { 'channel-name': 1, 'channel-code': 1 }).sort({ _id: -1 }, (err, channels) => {
            const items = fs.readdirSync(path.resolve('./scripts/gateway/controller'));
            var apps = []
            _lodash(items).forEach(fie => {
                if (fie.startsWith('v')) {
                    apps.push(fie.substring(0, fie.indexOf('.')))
                }
            })

            res.render('payment/test', {
                members,
                channels,
                apps: apps.reverse()
            });
        })
    })
})

/**
 * 提交参数
 */
router.post('/', async (req, res) => {
    let httpServer = req.app.get('httpServer');
    let domain = `${req.protocol}://${req.hostname}`;
    if (httpServer.address().port != 80) {
        domain += `:${httpServer.address().port}`;
    }

    var arg = {
        notify_url: `${domain}/run-test/notify`,
        return_url: `${domain}/run-test/callbcak`,


        version: req.body['version'],
        trade_money: req.body['trade_money'],
        action: req.body['action'],
        trade_no: req.body['trade_no'],
        pid: req.body['pid'],

        //选填参数
        bankcode: req.body['bankcode'],
        uid: req.body['uid'],
        title: req.body['title'],
        service: req.body['service'],
        args: req.body['args'],
    }
    let member = await mongo.Coll('member').findOne({ 'mbr-pid': req.body['pid'] })
    if (!member) {
        res.send('请选择 商户');
        return;
    }
    let gateway = await mongo.Coll('gateway').findOne({ 'channel-code': req.body['action'] })
    if (!gateway) {
        res.send('请选择 支付方式');
        return;
    }
    //订单号
    if (!arg.trade_no) {
        arg.trade_no = `TST${tool.random(3, 30)}`;
    }

    var key = member['mbr-sign-key'];
    // 签名算法
    var md5 = `${arg.pid}${arg.trade_no}${arg.notify_url}${arg.return_url}${arg.action}${arg.bankcode}${arg.uid}${arg.trade_money}&${key}`;
    console.log('clt:md5', md5)
    arg.sign = tool.md5(md5);

    var form = tool.createForm('/gateway/order', arg);

    res.send(form)
})

/**
 * [测试] 同步回调
 */
router.get('/callbcak', (req, res) => {
    let html = '<h3>收到平台发回的数据:</h3>';
    html += `status=${req.query.status}<br>`;
    html += `order=${req.query.order}<br>`;
    html += `money=${req.query.money}<br>`;
    html += `paytime=${req.query.paytime}<br>`;
    html += `type=${req.query.type}<br>`;
    html += `uid=${req.query.uid}<br>`;
    html += `time=${req.query.time}<br>`;
    html += `args=${req.query.args}<br>`;
    html += `sign=${req.query.sign}<br>`;
    html += '这是同步回调(异步回调的参数与同步回调一致),订单是否成功,尽量不在这里进行验证';
    res.send(html)
})
/**
 * [测试] 异步回调
 */
router.post('/notify', (req, res) => {
    res.send('success')
})

/**
 * 订单查询
 */
router.get('/list', async (req, res) => {
    let key = 'z6p6JWDFCMYc6t4AwYYM7mkh';
    let arg = {
        pid: 'fTseermi5f',            //商户id
        trade_no: '',  //指定订单号 [优先使用]
        page: 1,       //第几页 [没有订单号时返回 多条,并根据此值返回对应页码]
        sign: ''
    }
    let md5 = `${arg.pid}${arg.trade_no}${arg.page}&${key}`;
    arg.sign = tool.md5(md5);
    let data = await http.post('http://127.0.0.1:7856/gateway/list', tool.stringify(arg));
    res.json(data.data)
})
module.exports = router;