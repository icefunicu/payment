/**
 * 前台主页
 */
const path = require('path');
const router = require(`express`).Router();

const cStore = require(path.resolve('./scripts/system/cache-store')); 

/**
 * 首页
 */
router.get('/', async (req, res, next) => {

    let config = await cStore.getConfig();
    if (!config['is-open']) {
        res.send(config['site-stop-message'] || '站点正在维护中!');
        return;
    }
    res.render(`themes/default/index`, { config });
})
module.exports = router;