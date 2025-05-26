/**
 * 模板引擎
 */
const nunjucks = require('nunjucks');
const tool = require('../../utils/tool');
const { StartModel } = require('../constant');

module.exports = {
    /**
     * 模板引擎初始化
     * @param {express} app 实例
     */
    init(app) {

        app.set('view engine', 'html');
        app.set('views', ['./views','./scripts/plugins']);
        //模板引擎
        let env = nunjucks.configure(['./views','./scripts/plugins'], {
            trimBlocks: true,
            lstripBlocks: true,
            autoescape: true,
            noCache: process.env.NODE_ENV != StartModel.PRODUCTION,
            throwOnUndefined: false,
            web: {
                useCache: process.env.NODE_ENV == StartModel.PRODUCTION
            },
            express: app,
            tags: {
                blockStart: "{%",
                blockEnd: "%}",
                variableStart: "{{",
                variableEnd: "}}",
                commentStart: "{#",
                commentEnd: "#}"
            }
        });
        app.TEMPLATE = env;
        /**
         * 全局变量
         */
        env.addGlobal('time', new Date());
        env.addGlobal('ver', "7.2.605");
        

        /**
         * 时间格式化 1650421925887
         */
        env.addFilter('date', (str, formater) => {
            return tool.dateFormat(str, formater);
        })
        /**
         * 数值格式化
         */
        env.addFilter('number', (str, ...args) => {
            try {
                return tool.number_format(str, ...args);
            } catch (e) {
                return str;
            }
        })
        /**
         * obj to string
         */
        env.addFilter('tostring', (obj) => {
            try {
                return JSON.stringify(obj)
            } catch (e) {
                return obj;
            }
        })
        /**
         * array to log
         */
        env.addFilter('loglist', (obj) => {
            try {
                let str = '';
                console.log(typeof obj, obj)
                for (x in obj) {
                    str += obj[x] + '\n'
                }
                return str
            } catch (e) {
                return obj;
            }
        })
        /**
         * 金额格式化
         */
        env.addFilter('money', (str, prefix = '¥', decimals = 2) => {
            try {
                return prefix + tool.number_format(str, decimals, '.', ',');
            } catch (e) {
                return str;
            }
        })
    }
}