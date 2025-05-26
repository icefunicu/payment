/**
 * 处理订单支付页面逻辑
 */
const router = require(`express`).Router();
const mongo = require('../../config/database');
const cStore = require('../system/cache-store');
const { OrderState } = require('../gateway/order');
const { PostType } = require('../gateway/IPayPort');
/**
 * 不带参数 直接访问页面 禁止访问 [√]
 */
router.get('/', async (req, res, next) => {
    res.render('payment/error')
})
/**
 * 订单中转页面
 */
router.get('/trun/:oid', async (req, res) => {
    let order = await mongo.Coll('orders').findOne({ orderNumber: req.params.oid });
    if (!order) {
        res.render('payment/error', { message:res.__('tip-message.order-not-exist')  });
        return;
    }
    if (order['state'] == OrderState.NEW || order['state'] == OrderState.PAYING) {
        let pge = order['page'];
        if (!pge['IsSuccess']) {
            res.render('payment/error', { message: res.__('tip-message.order-form-error') });
            return;
        }

        switch (pge['PostType']) {
            case PostType.FORM:
                res.send(pge['Html']);
                break;
            case PostType.GET:
                res.redirect(pge['Html'])
                break;
            case PostType.JSON:
                res.json(pge['Html'])
                break;
            case PostType.POST:
                res.send(pge['Html'])
                break;

            case PostType.QRCODE:
            case PostType.QRIMG:
            case PostType.TRANSFER:
                res.redirect('/pay/' + req.params.oid)
                break;
        }
    } else {
        switch (order['state']) {
            case OrderState.PAYED:
            case OrderState.SUCCESS:
                res.render('payment/error', { message: '订单已付款' });
                return

            case OrderState.WAIVE:
                res.render('payment/error', { message: '用户已放弃付款' });
                return
            case OrderState.TIMEOUT:
                res.render('payment/error', { message: '订单超时,不可支付' });
                return
            case OrderState.FAILURE:
                res.render('payment/error', { message: '您的订单可能已付款,请联系商家处理' });
                return
        }
        res.render('payment/error', { message: '请降低您的付款频率' });
        return;
    }
})

/**
 * 展示支付页面 [√]
 */
router.get('/:oid', async (req, res, next) => {
    let config = await cStore.getConfig();
    if (!config['is-open']) {
        res.send(config['site-stop-message'] || '站点正在维护中!');
        return;
    }
    res.render('payment/index', {
        oid: req.params.oid,
        config: config
    })
})
/**
 * 拉取订单信息 [√]
 */
router.post('/order/genre', async (req, res) => {
    let order = await mongo.Coll('orders').findOne({ orderNumber: req.body.oid });
    if (!order) {
        // 订单不存在
        res.json({ error: true, title: '支付发生异常', message: '<p>订单不存在</p>', color: 'pink' });
        return;
    }
    if (order['state'] == OrderState.PAYED) {
        // 订单不存在
        res.json({ error: true, title: '支付发生异常', message: '<p>订单不存在</p>', color: 'pink' });
        return;
    }
    res.json(
        {

            EndTime: order.EndTime,                         //订单剩余秒数(每个订单 时间 不同)

            //解密展示方式:
            genre: order['gateway']['channel-page'],        //展示界面 QRCODE=扫码 TRANSFER=转账
            type: order['gateway']['channel-app'],          //使用哪个app扫码
            //订单号 与 金额:
            number: order['cus_order_id'],                  //商户 订单号
            money: order['cus_order_money'],                //订单金额

            //额外信息
            orderTitle: order['parms']['title'],            //订单标题,可能没有值
            orderUser: order['parms']['uid'],               //商户系统下用户ID
            orderService: order['parms']['service'],        //客服联系方式,没有则不显示

            postType: order['page']['PostType'],
            qr_data: order['page']['Html'],

            transfer: '13405052626'
        }
    )
})
/**
 * 判断订单状态 [√]
 */
router.post('/order/state', async (req, res) => {
    let order = await mongo.Coll('orders').findOne({ orderNumber: req.body.oid, 'EndTime': { $gte: Date.now() } }, { state: 1 });//只查询state字段
    if (!order) {
        order = { state: '0' }
    }
    res.json({ state: order['state'] }
    )
})
/**
 *  订单完成后 转向页面 [转向同步通知地址]
 */
router.get('/order/return', async (req, res) => {
    res.redirect('http://192.168.3.1')
})


module.exports = router;