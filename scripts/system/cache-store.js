/**
 * 全站缓存
 */
const cache = require('../../config/cache');
const mongo = require('../../config/database'); 
const constant = require('../../config/constant');

module.exports = {

    /**系统[系统参数设置] */
    SYS_CONFIG_SETTING: 'sys-config-setting',

    /**
     * 获取系统配置参数[√]
     */
    async getConfig() {
        let config = cache.get( this.SYS_CONFIG_SETTING);
        if (config) {
            return config;
        }
        config = await mongo.Coll('config').findOne({})
        if (config) {
            config = Object.assign(constant,config );
            cache.set(this.SYS_CONFIG_SETTING, config, 60 * 60 * 12);
            return config;
        } else {
            return {};
        }
    },
    /**
     * 设置缓存[√]
     */
    get: cache.get,
    /**
     * 读取缓存[√]
     */
    set: cache.set,
    /**
     * 移除指定缓存项[√]
     */
    remove: cache.remove
}