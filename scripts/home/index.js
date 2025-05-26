const tool = require('../../utils/tool');
/**
 * 前台主页
 */
const router = require(`express`).Router();


// router.get('/', async (req, res, next) => {

//     console.log('home ', req.headers['accept-language'].split(',')[0])
//     next();
// })
 

let theme = tool.getFile('./runtime/theme.cfg');
if (!theme) {
    theme = 'default';
}
if (Object.keys(theme).length < 1) {
    theme = 'default';
}
router.use(require(`../../views/themes/${theme}`));
 


module.exports = router;