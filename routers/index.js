/**
 * 路由
 */

const constant = require('../config/constant');
const auth = require('../scripts/rbac/Auth');
const mongo = require('../config/database');
const cache = require('../config/cache');
const { StartModel } = require('../config/constant');

module.exports = {
   /**
    * 路由绑定
    */
   bound(app) {
      /**
       * 系统首次运行 设置管理员账户数据
       */
      if (process.env.FIRST_START == 'true') {
         mongo.Coll('orders').insertOne({ 'test': 'test' })
         mongo.Coll('admin').updateOne(
            { account: 'admin' },
            {
               $set: {
                  about: "四方支付系统，网站:http://pay.ln.cn，开源地址:https://gitee.com/chianmain/payment，平台源码全部开源，无任何后门 无病毒。适合多商户 多系统统一收款使用",
                  account: "admin",
                  password: "e4d5eae979db440735d6af00ad902b81",
                  birthday: "2000-01-01",
                  face: "/public/images/admin.png",
                  nickname: "pay.ln.cn",
               }
            },
            { upsert: true });
      }
      /**
       * 仅运行以下形式请求 
       */
      app.use( (req, res, next) => {
         if (['GET', 'POST'].includes(req.method)) {
            next();
         } else {
            // 非允许的请求
            res.end('\0');
         }
      })

      //#region  系统自身 

      /**
       * 管理员后台
       */
      app.use(constant.ADMIN_MANAGE_PATH, require('../scripts/admin'));
      /**
       * 商户后台地址
       */
      app.use(constant.CUSTOMER_MANAGE_PATH, require('../scripts/member'))
      /**
       * 文件管理
       */
      app.use(['/files', "/assets"], require('../scripts/system/file-manage'));
      /**
       * 通用地址[如:验证码]
       */
      app.use('/cgi-bin', require('../utils/common'));

      //#endregion
      
      /**
      * test 项目测试[仅在调试模式有效]
      * 与正式系统无关 可有可无
      */
      app.use('/run-test', require('../test'));
      
      /**
       * 支付页面
       */
      app.use('/pay', require('../scripts/payment'));



      //#region  对外接口

      /**
       * 接口收单 /gateway/order
       */
      app.use('/gateway', require('../scripts/gateway/gateway'));
      /**
       * 通知地址处理 [上游发送至本系统]
       */
      app.use('/trade', require('../scripts/gateway/notify'));

      //#endregion

      /**
       * 前台首页[前台不判断权限]
       */
      app.use('/', require('../scripts/home'));
      app.use('/etc', require('../scripts/system/install'));
      /**
       * 未处理的请求 
       */
      app.use((req, res, next) => {
         if (process.env.NODE_ENV == StartModel.PRODUCTION) {
            console.error('请求未配置路由:%s', req.path)
            if (req.method == 'GET') {
               res.render('pages/404');//渲染 404 页面
            } else {
               res.json({ code: 404, message: '服务器异常,请稍后再试' })
            }
         } else {
            console.info(`Cannot GET ${req.url}`);
            next();
         }
      })
   }
}