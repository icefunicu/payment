/**
 * 系统基础模块
 */
const router = require(`express`).Router();
const mongo = require('../../config/database');
const cache = require('../system/cache-store');
const sns_config = require('../apis/sns_port');
const _lodash = require('lodash');

/**
 * 系统基础设置[√]
 */
router.all('/configs', async (req, res) => {
    if (req.method == 'GET') {
        let config = await mongo.Coll('config').findOne({});

        _lodash(sns_config.Args).forEach(val => {
            if (config && config[val.name]) {
                val.val = config[val.name];
            }
        })
        res.render('admin/config', { config, snsData: sns_config.Args })
    } else {
        let coll = mongo.Coll('config');
        await coll.remove();
        await coll.save(req.body);
        //重置緩存數據
        cache.set(cache.SYS_CONFIG_SETTING, req.body);
        res.json({ success: true, message: res.__('tip-message.alter-success') });
    }
});
/**
 * 系统主题设置
 */
router.all('/setting', async (req, res, next) => {
    if (req.method == 'GET') {
        next();
    } else {
        let property = req.body['property'];
        let value = req.body['value'];
        let coll = mongo.Coll('setting');
        let doc = await coll.updateOne(
            { prop: property },
            { $set: { val: value } },
            { upsert: true }
        );
        res.json({ success: true, message: res.__('tip-message.alter-success') });
    }
})

/**
 * 消息中心
 */
router.get('/mail-center', (req, res, next) => {
    res.render('shared/etc/message', {

    });
})
/**
 * 图表 测试页面
 */
router.get('/chart', (req, res, next) => {
    res.render('shared/__chart', {});
})



module.exports = router;