/**
 * 前台主页
 */
const router = require(`express`).Router();
const cStore = require('../../../scripts/system/cache-store');
const mongo = require('../../../config/database');
const _lodash = require('lodash');

/**
 * 首页
 */
router.get('/', async (req, res, next) => {

    let config = await cStore.getConfig();
    if (!config['is-open']) {
        res.send(config['site-stop-message'] || '站点正在维护中!');
        return;
    }
    res.render(`themes/pink/index`, { config });
})

/**
 * 关于页面
 */
router.get('/about', async (req, res, next) => {
    let config = await cStore.getConfig();
    if (!config['is-open']) {
        res.send(config['site-stop-message'] || '站点正在维护中!');
        return;
    }
    res.render(`themes/pink/about`, { config });
})

/**
 * 文档页面
 */
router.get('/docs', async (req, res, next) => {
 

    let config = await cStore.getConfig();
    if (!config['is-open']) {
        res.send(config['site-stop-message'] || '站点正在维护中!');
        return;
    }
    res.render(`themes/pink/docs`, { config });
})

/**
 * 文章列表页面
 */
router.get('/news/:pageindex?', async (req, res, next) => {
    let config = await cStore.getConfig();
    if (!config['is-open']) {
        res.send(config['site-stop-message'] || '站点正在维护中!');
        return;
    }
    let pageIndex = 1;
    if (req.params.pageindex) {
        pageIndex = parseInt(req.params.pageindex)
    }
    let query = { 'type': '新闻' };
    mongo.Coll('news').find(query).sort({ add: mongo.SORT_DESC }).skip(10 * (pageIndex - 1)).limit(10, async (err, data) => {
        let args = {
            config,
            data,
            total: await mongo.Coll('news').count(query),
            pageIndex,
            pageTotal: 1
        }
        args.pageTotal = Math.ceil(args.total / 10)
        res.render(`themes/pink/news`, args);
    })
})
/**
 * 文章读取页面
 */
router.get('/details/:nid', async (req, res, next) => {
    let config = await cStore.getConfig();
    if (!config['is-open']) {
        res.send(config['site-stop-message'] || '站点正在维护中!');
        return;
    }

    let data = await mongo.Coll('news').findOne({ _id: mongo.ObjectId(req.params.nid) });
    res.render(`themes/pink/details`, { config, data });
})

module.exports = router;