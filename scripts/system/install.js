/**
 * 系统安装
 */

const router = require(`express`).Router();
/**
 * 安装程序首页
 */
router.get('/install', async (req, res) => {
   res.render('install/index')
});
 


module.exports = router;