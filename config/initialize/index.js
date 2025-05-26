/**
 * 初始化 express
 */

const express = require('express');
const helmet = require("helmet");
const fs = require("fs");
const _path = require("path");
const tpl = require('../template');
const lang = require('../locales');
const router = require('../../routers');
const log = require('../../utils/logger');
const schedule = require('../../utils/schedule');
const { StartModel, SETUP_FILE_PATH } = require('../constant');
const chat = require('../../scripts/message');

module.exports = {
    /**
     * 运行 express
     * @param {string} debug 系统启动模式
     * @param {number} port 监听端口
     */
    launch(debug = StartModel.PRODUCTION, port = 80) {
        if (debug == StartModel.DEBUG) {
            console.log("NODE PATH:", process.execPath, process.versions);
        }
        //#region 处理异常

        process.on('uncaughtException', err => {
            console.error("未处理的异常:");
            console.error(`$异常:${err.message}\n${err.stack}`);
            console.error("---------------------------------------------------------------------------------");
        });
        process.on('uncaughtExceptionMonitor', err => {
            console.error("uncaughtExceptionMonitor:", err);

        });
        process.on('unhandledRejection', err => {
            console.error("Promise Error:", err);
        });

        //#endregion

        /**
         * 设置全局运行模式
         */
        process.env.NODE_ENV = debug;

        //#region 判定是否 首次运行
        try {
            process.env.FIRST_START = !fs.statSync(_path.resolve(SETUP_FILE_PATH)).isFile();
        } catch (ex) {
            process.env.FIRST_START = 'true';
        }
        //#endregion
        console.log('首次运行?  :: ', process.env.FIRST_START)

        console.error(' 启动参数 :', process.argv.slice(2));

        if (debug == StartModel.PRODUCTION) {
            console.clear();
            console.log(`控制台不输出信息,请到logs文件夹下查看日志`);
            console.log = log.info;
            console.debug = log.debug;
            console.error = log.error;
            console.warn = log.warn;
            console.trace = log.trace;
            console.info = log.info;
        }
        //日志 扩展
        console.pay = log.pay;
        console.fatal = log.fatal;
        console.record = log.record;
        console.log(`[${new Date().toLocaleTimeString()}] express starting [pid:${process.pid}] [node:${process.version}]`);
        

          
        
        let app = express();

        // http 请求详细 日志 [ 调试模式下记录http请求,便于定位错误 ]
        if (debug == StartModel.DEBUG && process.argv.includes('HTTPLOG')) {
            app.use(log.httpLogger);
        }

        /**
         * 多语言
         */
        lang.init(app);

        /**
         * 模板
         */
        tpl.init(app);

        /**
         * 静态资源
         */
        app.use(express.static('assets', {
            maxAge: '2h',
            immutable: true,
            extensions: [],
            dotfiles: 'ignore',//allow deny ignore
            etag: true
        }));

        /**
         * 响应头
         */
        app.use(helmet.hidePoweredBy());
        app.use(helmet.xssFilter());

        //跨域请求,尽量屏蔽
        if (debug == StartModel.DEBUG) {
            app.use(function (req, res, next) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'POST,GET,HEAD');
                res.header('Access-Control-Allow-Headers', 'x-requested-with,Content-Type,origin,authorization,accept,client-sent-security-token,Content-Type');
                res.header('Access-Control-Allow-Credentials', 'true');
                res.header('Access-Control-Expose-Headers', 'Content-Security-Policy, Location');
                next();
            });
        }

        /**
         * 基础数据
         */
        app.use(express.json());
        app.use(express.urlencoded({ extended: false, parameterLimit: 200 }));
        /**
         * cookie
         */
        app.use(require('cookie-parser')('ex-sesssionn', { sameSite: 'Strict' }));
        /**
         * session 只保留 1 分钟
         */
        app.use(require('../session'));
        /**
         * 定时任务
         */
        schedule.start();
        /**
         * 绑定业务路由
         */
        router.bound(app);

        /**
         * websocket 服务
         */
        chat.start(app);

        let httpServer = app.listen(port, '0.0.0.0', () => {
            //如果是首次运行 启动后创建安装文件 
            if (process.env.FIRST_START == 'true') {
                fs.writeFileSync(_path.resolve(SETUP_FILE_PATH), new Date().toLocaleString());
            }
            app.set('httpServer', httpServer);
            app.locals.NODE_ENV = debug;

            console.debug(`[http]服务启动成功:http://${httpServer.address().address}:${httpServer.address().port}`);
            console.debug(`[${new Date().toLocaleTimeString()}] express started [http]: OK`);
        });
    }
}
