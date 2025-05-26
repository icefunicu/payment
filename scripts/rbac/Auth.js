/**
 * 权限认证
 */
const mongo= require('../../config/database');
const constant = require('../../config/constant');

module.exports = {
    /**
     * 请求判断权限
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    authentication(req, res, next) {
        //console.clear();
        //console.log(req)
        next();
        return
        if (req.url.endsWith('/')) {
            req.url = req.url.substring(0, req.url.length - 1);
        }

        console.log('auth:', req.url, req.method)

        if (req.method == 'GET') {
            if (req.url.startsWith(constant.ADMIN_MANAGE_PATH) && ![
                constant.ADMIN_MANAGE_PATH,
                constant.ADMIN_MANAGE_PATH_LOGIN
            ].includes(req.url)) {
                res.render('pages/auth');
            } else if (req.url.startsWith(constant.CUSTOMER_MANAGE_PATH)) {

            } else if (req.url.startsWith(constant.USER_HOME_PATH)) {

            } else {
                next();
            }
        } else if (req.method == 'POST') {
            if([constant.ADMIN_MANAGE_PATH_LOGIN].includes(req.url)){
                next();
                return;
            }
            res.json({ success: true })
        } else {
            next();
        }
    }
}