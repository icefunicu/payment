/**
 * 商户消息中心
 */
const router = require(`express`).Router();

/**
 * 读取授权
 */
router.post('/auth', (req, res) => {
    try {
        let user = res.app.locals.customer;
        res.json({ success: true, name: user['mbr-name'], uid: user['_id'], avatar: user['avatar'] })
    } catch (e) {
        res.json({ success: false })
    }

})

module.exports = router;