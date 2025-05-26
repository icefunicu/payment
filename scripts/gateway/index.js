/**
 * 接口渠道 [后台使用]
 */

const fs = require('fs');
const constant = require('../../config/constant');
const mongo = require('../../config/database');
const path = require('path');
const router = require(`express`).Router();
const _lodash = require('lodash');
const tool = require('../../utils/tool');
const pay_out=require('./controller/pay_out');
/**
 * 接口文件存放文件夹
 */
const interfacesDir = `./scripts/gateway/interfaces/`;

//#region 上游渠道处理

/**
 * 接口管理
 */
router.all('/gateways', async (req, res) => {
    if (req.method == 'GET') {
        res.render('gateway/gateway-manage');
    } else {
        //删除接口
        if (req.body['type'] == 'remove') {
            //删除物理文件
            let doc = await mongo.Coll('channels').findOne({ _id: mongo.ObjectId(req.body['did']) });
            try{
                fs.unlinkSync(path.resolve(doc['path']));
            }catch(e){
                console.error(e)
            }
            //删除记录
            await mongo.Coll('channels').remove({ _id: mongo.ObjectId(req.body['did']) });
            res.json({ success: true, message: '删除成功' });
            return
        }

        mongo.Coll('channels').find({}).sort({_id:mongo.SORT_DESC}, async (err, docs) => {
            res.json({
                success: true,
                datas: docs,
                total: await mongo.Coll('channels').count({})
            })
        })
    }
});

/**
 * 验证接口代码是否正确
 * @param {String} gCode 代码
 * @returns 是否成功
 */
function checkCode(gCode) {
    fs.writeFileSync(constant.TEMP_DIR + '/upload-js-code.js', gCode);
    try {
        let modelPath = path.resolve(constant.TEMP_DIR + '/upload-js-code.js');
        //删除缓存
        delete require.cache[modelPath];
        let temp = require(modelPath);
        if (typeof temp.Init == 'function'
            && typeof temp.Build == 'function'
            && typeof temp.Validation == 'function'

            && typeof temp.Args == 'object'
            && typeof temp.Gateways == 'object'

            && typeof temp.Version == 'string'
            && typeof temp.Away == 'string'
            && typeof temp.Describe == 'string'
            && typeof temp.Name == 'string' &&
            temp.Version && temp.Away && temp.Name
        ) {
            //创建文件夹
            let pathDir = path.resolve(interfacesDir);
            fs.mkdirSync(pathDir, { recursive: true });
            //验证成功
            return temp;
        }
        return false;

    } catch (e) {
        return false;
    }
}
/**
 * 更新接口代码[完成]
 */
router.all('/channel-update', async (req, res) => {
    let channel = await mongo.Coll('channels').findOne({ _id: mongo.ObjectId(req.query['did']) });
    if (req.method == 'GET') {
        let code = fs.readFileSync(path.resolve(channel['path']));
        res.render('gateway/channel-update', { code: code });
    } else {
        let gCode = req.body['gateway-code'];
        let temp = checkCode(gCode);
        if (temp) {
            channel.Name = temp.Name;
            channel.Version = temp.Version;
            channel.Describe = temp.Describe;
            channel.Gateways = temp.Gateways;
            // 保留之前设置的参数值 
            _lodash(temp.Args).forEach(val => {
                _lodash(channel.Args).forEach(gvl => {
                    if (val.name == gvl.name) {
                        val.val = gvl.val;
                    }
                })
            })
            channel.Args = temp.Args;

            channel.updateTime = new Date();
            await mongo.Coll('channels').updateOne({ _id: channel._id }, { $set: channel }, { upsert: false });

            fs.writeFileSync(path.resolve(channel['path']), gCode);
            res.json({ message: '接口更新成功', success: true });

        } else {
            res.json({ message: '代码不合法,请参阅接口规范' })
            return;
        }
    }
})
/**
 * 安装支付接口[√]
 */
router.all('/gateway-append', async (req, res) => {
    if (req.method == 'GET') {
        res.render('gateway/gateway-add');
    } else {
        let gName = req.body['gateway-name'];
        let gCode = req.body['gateway-code'];

        if(!gName){
            res.json({ message: '请填写渠道名称' });
            return;
        }
        if (await mongo.Coll('channels').count({ 'gName': gName }) > 0) {
            res.json({ message: '渠道商名称重复' });
            return;
        }
        let temp = checkCode(gCode);
        if (temp) {
            //记录代码到数据库
            let pathDir = path.resolve(interfacesDir);
            let name = tool.random(3, 10);
            let _file = path.join(pathDir, name + '.js');
            await mongo.Coll('channels').save({
                'gName': gName,
                'path': interfacesDir + `${name}.js`,
                'addTime': new Date(),
                Name: temp.Name,
                Version: temp.Version,
                Away: temp.Away,
                Describe: temp.Describe,

                Args: temp.Args,//需要设置的参数
                Gateways: temp.Gateways//支持的渠道
            })

            fs.writeFileSync(_file, gCode);
            res.json({ message: '添加成功', success: true });
        } else {
            res.json({ message: '代码不合法,请参阅接口规范' })
            return;
        }

    }
})
/**
 * 接口参数设置[√]
 */
router.all('/channel-args', async (req, res) => {
    if (req.method == 'GET') {
        res.render('gateway/channel-args', { data: await mongo.Coll('channels').findOne({ _id: mongo.ObjectId(req.query['did']) }) });
    } else {
        let doc = await mongo.Coll('channels').findOne({ _id: mongo.ObjectId(req.query['did']) });

        _lodash(doc['Args']).forEach(val => {
            val.val = req.body[val.name];
        });

        await mongo.Coll('channels').updateOne({ _id: doc._id }, {
            $set: doc
        }, { upsert: false });

        res.json({ success: true, message: '参数设置成功' });
    }
})
//#endregion

/**
 * 支付方式管理 [√]
 */
router.all('/pay-type', async (req, res) => {
    if (req.method == 'GET') {
        mongo.Coll('gateway').find({}).sort({ 'pay-code': mongo.SORT_DESC }, function (err, docs) {
            res.render('./gateway/pay-type', {
                data: docs
            });
        })
    } else {
        if (req.body.type == 'remove') {
            await mongo.Coll('gateway').remove({ 'channel-code': req.body['did'] });
            res.json({ message: '删除成功', success: true })
        } else if (req.body.type == 'start-stop') {
            await mongo.Coll('gateway').updateOne({ 'channel-code': req.body['did'] }, { $set: { 'channel-used': req.body['used'] } });
            res.json({ message: ((req.body['used'] == 'true') ? '启用成功' : '停用成功'), success: true })
        }
        else {
            if (!req.body['channel-name']) {
                res.json({ message: '名称不能为空', success: false })
                return;
            }
            mongo.Coll('gateway').find({}, { 'pay-code': 1 }).sort({ 'pay-code': mongo.SORT_DESC }).skip(0).limit(1, function (err, doc) {
                let pay_code = 0;
                try {
                    pay_code = doc[0]['pay-code'];
                } catch (er) {
                    pay_code = 0;
                }
                pay_code = pay_code + 1;
                req.body['channel-code'] = 'SN2010' + pay_code;
                req.body['pay-code'] = pay_code;
                req.body['channel-used'] = 'true';
                /**
                 * 添加到数据库
                 */
                mongo.Coll('gateway').save(req.body);
                res.json({ message: '添加成功', success: true })
            })
        }
    }
});

/**
 * 渠道绑定[√]
 */
router.all('/channel-bound', async (req, res) => {
    if (req.method == 'GET') {
        let gChannel = await mongo.Coll('gateway').findOne({ _id: mongo.ObjectId(req.query['did']) });
        mongo.Coll('channels').find({}, (err, docs) => {
            res.render('./gateway/channel-bound', { data: docs, gChannel: gChannel });
        })
    } else {
        if (!req.body['defval']) {
            res.json({ message: '必须选择默认渠道' });
            return;
        }
        let g = req.body['defval'].split('|');
        let gateway = g[0];//网关编码
        let channel = g[1];//渠道编码
        let isDef = false;
        if (typeof (req.body['used']) == 'string') {
            req.body['used'] = [req.body['used']]
        }
        _lodash(req.body['used']).forEach(val => {
            if (val == req.body['defval']) {
                isDef = true;
            }
        });
        if (!isDef) {
            res.json({ message: '默认支付方式必须是已选映射渠道内方式!' });
            return;
        }
        //当前支付方式
        let gChannel = await mongo.Coll('gateway').findOne({ _id: mongo.ObjectId(req.query['did']) });
        //接口渠道中设置文本
        mongo.Coll('channels').find({}, { gName: 1, Gateways: 1, Name: 1, Away: 1 }, async (err, docs) => {
            //默认渠道
            _lodash(docs).forEach(val => {
                //默认
                if (val.Away == gateway) {
                    _lodash(val.Gateways).forEach(gv => {
                        if (gv.Gateway == channel) {
                            gChannel['channel-default'] = { gName: val.gName, text: gv.Text, gateway, channel };
                        }
                    })
                }
            })

            let hasChannel = []
            //映射渠道
            _lodash(req.body['used']).forEach(val => {
                g = val.split('|');
                gateway = g[0];//网关编码
                channel = g[1];//渠道编码
                _lodash(docs).forEach(val => {
                    //默认
                    if (val.Away == gateway) {
                        _lodash(val.Gateways).forEach(gv => {
                            if (gv.Gateway == channel) {
                                hasChannel.push({ gName: val.gName, text: gv.Text, gateway, channel });
                            }
                        })
                    }
                })
            });
            gChannel['channel-gateways'] = hasChannel;
            await mongo.Coll('gateway').updateOne({ _id: gChannel._id },
                {
                    $set: gChannel
                }, { upsert: false });

            res.json({ message: '绑定成功', success: true });

        })


    }
});
/**
 * 接口轮换[完成]
 */
router.all('/channel-rotate', async (req, res) => {
    if (req.method == 'GET') {
        let gChannel = await mongo.Coll('gateway').findOne({ _id: mongo.ObjectId(req.query['did']) });
        res.render('./gateway/channel-rotate', { data: gChannel });
    } else {
        /**
         * 当前设置的规则
         */
        let gChannel = await mongo.Coll('gateway').findOne({ _id: mongo.ObjectId(req.query['did']) });
        //设置轮换规则
        gChannel['trunType'] = req.body['trun-type'];

        //#region timing 时间轮换 
        _lodash(gChannel['channel-gateways']).forEach(val => {
            let timeStart = req.body[`time-start-${val.gateway}-${val.channel}`];
            let timeEnd = req.body[`time-end-${val.gateway}-${val.channel}`];
            //定时规则
            val['timing'] = { timeStart, timeEnd }
        });
        //#endregion

        //#region loop 顺序轮换 
        _lodash(gChannel['channel-gateways']).forEach(val => {
            let loopIndex = req.body[`loop-index-${val.gateway}-${val.channel}`];
            //顺序轮换
            val['loopIndex'] = parseInt(loopIndex);
        });
        //#endregion

        //#region full-count 满笔 
        _lodash(gChannel['channel-gateways']).forEach(val => {
            let countMini = req.body[`full-count-mini-${val.gateway}-${val.channel}`];
            let countMax = req.body[`full-count-max-${val.gateway}-${val.channel}`];
            //满笔轮换规则
            val['fullCount'] = { countMini, countMax }
        });
        //#endregion

        //#region full-money 满额 
        _lodash(gChannel['channel-gateways']).forEach(val => {
            let moneyMini = req.body[`full-money-mini-${val.gateway}-${val.channel}`];
            let moneyMax = req.body[`full-money-max-${val.gateway}-${val.channel}`];
            //满额轮换规则
            val['fullMoney'] = { moneyMini, moneyMax }
        });
        //#endregion

        //#region one-money 单笔额度
        _lodash(gChannel['channel-gateways']).forEach(val => {
            let oneMini = req.body[`one-money-mini-${val.gateway}-${val.channel}`];
            let oneMax = req.body[`one-money-max-${val.gateway}-${val.channel}`];
            //单笔额度
            val['oneMoney'] = { oneMini, oneMax }
        });
        //#endregion


        await mongo.Coll('gateway').updateOne({ _id: gChannel._id }, { $set: gChannel }, { upsert: false });
        res.json({ message: '规则设置成功', success: true })
    }
});

/**
 * 添加代付接口
 */
router.all('/out-pay-add',async (req,res)=>{
    if(req.method == 'GET'){
        res.render('gateway/out-pay-add')
    }else{
        await pay_out.add(req,res);
    }
})
/**
 * 代付接口管理
 */
router.all('/out-pay-manage',async (req,res)=>{
    if(req.method == 'GET'){
        res.render('gateway/out-pay-manage')
    }else{
        await pay_out.manager(req,res);
    }
})
/**
 * 代付接口管理
 */
router.all('/out-pay-args',async (req,res)=>{
    await pay_out.Args(req,res);
})
/**
 * 代付接口更新
 */
router.all('/out-pay-update', async (req, res) => {
    await pay_out.Update(req,res);
})


module.exports = router;