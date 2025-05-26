/**
 * 同步回调 与 异步通知
 * 提交给上游的通知地址
 * 
 * 同步地址:http(s)://本系统域名/trade/接口网关/callback
 * 异步步地址:http(s)://本系统域名/trade/接口网关/notify
 * 
 * 地址中的 notify 和 callback 为固定值 notify:认定为异步回调,callback:认定为同步回调 不可修改
 * 
 * 接口网关:可在 接口管理中 渠道管理的网关值(这个值在数据库中,必须唯一,在撰写接口代码时之星)
 * 
 * 
 */

const router = require(`express`).Router();
const mongo = require('../../config/database');
const path = require('path');
const { CallBackType } = require('./IPayPort');
const oManage = require('./OrderManage');

// 判定回调接口
router.use('/:controller/:calltype', async (req, res, next) => {
    //基本参数判断
    if (!req.params.controller || !req.params.calltype) {
        res.status(201).send({ msg: 'url 地址错误', code: 412 });
        return;
    }

    let channel = await mongo.Coll('channels').findOne({ 'Away': req.params.controller });
    //渠道是否存在
    if (!channel) {
        res.status(201).send({ msg: 'url 地址错误', code: 413 });
        return;
    }

    try {
        //删除模块,避免代码更新后,调用缓存的情况
        delete require.cache[path.resolve(channel['path'])];
    } catch (e) {
        console.pay('清理支付接口缓存', e);
    }

    //尝试引入接口 验证通知结果
    let iport = require(path.resolve(channel['path']));
    if (!iport) {
        res.status(201).send({ msg: 'url 地址错误', code: 414 });
        return;
    }
    //同步 异步 回调类型
    let _callBackType = (req.params.calltype == 'notify' ? CallBackType.Asyn : req.params.calltype == 'callback' ? CallBackType.Sync : 'error');
    if (_callBackType == 'error') {
        res.status(201).send({ msg: 'url 地址错误', code: 415 });
        return;
    }
    //设置基础参数
    iport.Init(channel.Args);
    //调用接口 验证参数
    let _callBackResults = await iport.Validation(_callBackType, req);

    console.pay('验证结果:', _callBackResults);

    //接口验证成功:只要接口是成功 则首先设置订单状态 并给商户结算
    if (_callBackResults.IsSuccess) {
        //修改订单状态
        //商户结算
        //向商户发送 异步通知
        let ok = await oManage.OrderPayed(_callBackResults.CallBackOrder);
        console.pay('订单结算(ok) 结果:', ok);
        if (ok.send) {
            console.pay('结算成功 立即发送一次异步通知:');
            //延时 120 毫秒后发送通知
            setTimeout(async () => {
                let sendOk = await oManage.SendNotify(_callBackResults.CallBackOrder.Order);
                console.pay('异步通知:', sendOk);
            }, 120);
        }
        console.pay('结算与通知完成,向上游返回结果:');
        if (_callBackType == CallBackType.Asyn) {
            console.pay('异步:', iport.NotifySuccessMessage);
            //只要验证成功,则通知上游没必要再发通知
            //如果出现订单异常情况,可以进行手动补单
            res.send(iport.NotifySuccessMessage);
            return
        } else {
            //[这里需要进行跳转,或者展示某个页面]
            console.pay('同步:', iport.NotifySuccessMessage);
            //同步通知地址:跳转
            let url = await oManage.CallBack(_callBackResults.CallBackOrder.Order);
            res.redirect(url);
        }
    } else {
        console.pay('验证不成功,向上游返回结果:');
        //验证结果不成功
        if (_callBackType == CallBackType.Asyn) {
            console.pay('异步:', _callBackResults.Message);
            res.json({ message: _callBackResults.Message });
            return
        } else {
            console.pay('同步:', _callBackResults.Message);
            //同步通知地址:
            res.send(_callBackResults.Message);
        }
    }



});


module.exports = router;