/**
 * 
 */
let i18n = require('i18n');
const { StartModel } = require('../constant');
module.exports = {
    /**
     * 多语言模块
     * @param {express} app 实例
     */
    init(app) {

        /** 
         * 
         * __n('%s cat', 1) // --> 1 Katze
         * __mf('Hello {name}, how was your %s?', 'test', { name: 'Marcus' }) // --> Hallo Marcus, wie war dein test?
         * 
         * __l('Hello') // --> [ 'Hallo', 'Hello' ] {返回给定短语在每种语言中的翻译列表。}
         * __h('Hello') // --> [ { de: 'Hallo' }, { en: 'Hello' } ] {返回给定短语在每种语言中的翻译散列列表。}
         */
        console.log(`i18n:${i18n.version}`);
        i18n.configure({
            autoReload: process.env.NODE_ENV == StartModel.DEBUG,//debug 模式自动加载语言环境
            prefix: 'pc-',
            
            objectNotation: true,               // 支持多级别
            extension: '.json',                 // 后缀名
            locales: ['zh', 'en', 'ja'],        // 声明包含语言
            directory: 'config/locales',        // 设置语言文件目录
            queryParameter: 'lang',             // 设置查询参数
            ///defaultLocale: 'zh',                // 设置默认语言
            header:"accept-language",

            cookie:'app-lang',
            missingKeyFn: (lang, key) => {
                //未找到指定名称时 返回的数据
                console.debug(`i18n:key-not:${key}`);
                return ''
            },
            logDebugFn: (msg) => {
                console.debug(`i18n:debug:${msg}`);
            },
            logWarnFn: (msg) => {
                console.debug(`i18n:warn:${msg}`);
            },
            logErrorFn: (msg) => {
                console.debug(`i18n:error:${msg}`);
            }
        });
        app.use(i18n.init);
    }
}