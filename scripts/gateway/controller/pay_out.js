/**
 * API代付出款
 */

const mongo = require('../../../config/database');
const tool = require('../../../utils/tool');
const _lodash = require('lodash');
const fs = require('fs');
const path = require('path');
const constant = require('../../../config/constant');
/**
 * 代付接口存放地址
 */
const interfacesDir = `./scripts/gateway/interfaces/`;

/**
 * 验证接口代码是否正确
 * @param {String} gCode 代码
 * @returns 是否成功
 */
function checkCode(gCode) {
    fs.writeFileSync(constant.TEMP_DIR + '/upload-out-pay-code.js', gCode);
    try {
        let modelPath = path.resolve(constant.TEMP_DIR + '/upload-out-pay-code.js');
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
        console.log('代付:', e)
        return false;
    }
}


module.exports = {
    /**
     * 代付出款
     * @param {Object} body 请求体
     */
    async Receipt(_parm) {
        let trade_money = parseFloat(_parm['trade_money']);

        //#region 基础参数验证
        if (isNaN(trade_money) || trade_money < 0) {
            return { success: false, code: 8022 };
        }
        _lodash(['pid', 'trade_no', 'trade_money', 'account', 'acc_type', 'bank_name', 'bank_phone', 'card_name', 'sign']).forEach(val => {
            if (!_parm[val]) {
                return { success: false, code: 8023, message: val };
            }
        });
        //#endregion

        //#region 商户状态验证
        let member = await mongo.Coll('member').findOne({ 'mbr-pid': _parm['pid'] });
        if (!member) {
            return { success: false, code: 8024 };
        }
        //账户已停用
        if (member['mbr-is-use'] != '启用') {
            return { success: false, code: 8025 };
        }
        //api代付未开通
        if (member['mbr-api-pay-use'] != '开通') {
            return { success: false, code: 8026 };
        }
        // 账户已过有效期
        if (new Date(member['mbr-end-date']) < new Date()) {
            return { success: false, code: 8027 };
        }
        //#endregion
        let risk = member['mbr-risk'];
        //金额太小
        if (trade_money < parseFloat(risk['draw-min-one'])) {
            return { success: false, code: 8028 };
        }
        //金额太大
        if (trade_money > parseFloat(risk['draw-max-one'])) {
            return { success: false, code: 8029 };
        }
        //验证签名
        let md5 = `${_parm['pid']}${_parm['trade_no']}${_parm['trade_money']}${_parm['account']}${_parm['acc_type']}${_parm['bank_name']}${_parm['bank_phone']}${_parm['card_name']}&${member['mbr-sign-key']}`
        let mySign = tool.md5(md5);
        if (mySign.toLowerCase() != _parm['sign'].toLowerCase()) {
            return { success: false, code: 8031 };
        }
        // TODO: 验证提款账户

        return { success: false, code: 0, message: "xxxxx" }
    },

    /**
     * 添加代付接口
     */
    async add(req, res) {
        let gName = req.body['gateway-name'];
        let gCode = req.body['gateway-code'];

        if (!gName) {
            res.json({ message: '请填写渠道名称' });
            return;
        }
        if (await mongo.Coll('out-pay').count({ 'gName': gName }) > 0) {
            res.json({ message: '渠道商名称重复' });
            return;
        }
        let temp = checkCode(gCode);
        if (temp) {
            //记录代码到数据库
            let pathDir = path.resolve(interfacesDir);
            let name = tool.random(3, 12);
            let _file = path.join(pathDir, name + '.js');
            await mongo.Coll('out-pay').updateOne({ 'Away': temp.Away }, {
                $set: {
                    'gName': gName,
                    'path': interfacesDir + `${name}.js`,
                    'addTime': new Date(),
                    Name: temp.Name,
                    Version: temp.Version,
                    Away: temp.Away,
                    Describe: temp.Describe,

                    Args: temp.Args,//需要设置的参数
                    Gateways: temp.Gateways//支持的渠道
                }
            }, { upsert: true })

            fs.writeFileSync(_file, gCode);
            res.json({ message: '添加成功', success: true });
        } else {
            res.json({ message: '代码不合法,请参阅接口规范' })
            return;
        }
    },
    /**
     * 代付接口管理
     * @param {Object} req 请求体
     * @param {Object} res 响应体
     */
    async manager(req, res) {
        //删除接口
        if (req.body['type'] == 'remove') {
            //删除物理文件
            let doc = await mongo.Coll('out-pay').findOne({ _id: mongo.ObjectId(req.body['did']) });
            try {
                fs.unlinkSync(path.resolve(doc['path']));
            } catch (e) {
                console.error(e)
            }
            //删除记录
            await mongo.Coll('out-pay').remove({ _id: mongo.ObjectId(req.body['did']) });
            res.json({ success: true, message: '删除成功' });
            return
        }

        mongo.Coll('out-pay').find({}).sort({ _id: mongo.SORT_DESC }, async (err, docs) => {
            res.json({
                success: true,
                datas: docs,
                total: await mongo.Coll('out-pay').count({})
            })
        })
    },
    /**
     * 代付接口参数设置
     * @param {Object} req 请求体
     * @param {Object} res 响应体
     */
    async Args(req, res) {
        if (req.method == 'GET') {
            res.render('gateway/out-pay-args', { data: await mongo.Coll('out-pay').findOne({ _id: mongo.ObjectId(req.query['did']) }) });
        } else {
            let doc = await mongo.Coll('out-pay').findOne({ _id: mongo.ObjectId(req.query['did']) });

            _lodash(doc['Args']).forEach(val => {
                val.val = req.body[val.name];
            });

            await mongo.Coll('out-pay').updateOne({ _id: doc._id }, {
                $set: doc
            }, { upsert: false });

            res.json({ success: true, message: '参数设置成功' });
        }
    },
    /**
     * 代付接口更新
     * @param {Object} req 请求体
     * @param {Object} res 响应体
     */
    async Update(req,res){
        let channel = await mongo.Coll('out-pay').findOne({ _id: mongo.ObjectId(req.query['did']) });
        if (req.method == 'GET') {
            let code = fs.readFileSync(path.resolve(channel['path']));
            res.render('gateway/out-pay-update', { code: code });
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
                await mongo.Coll('out-pay').updateOne({ _id: channel._id }, { $set: channel }, { upsert: false });
    
                fs.writeFileSync(path.resolve(channel['path']), gCode);
                res.json({ message: '接口更新成功', success: true });
    
            } else {
                res.json({ message: '代码不合法,请参阅接口规范' })
                return;
            }
        }
    }
}