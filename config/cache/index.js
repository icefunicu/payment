/**
 * 缓存系统
 */
// const redis = require("redis");
// const constant = require('../constant');
// const redisClient = redis.createClient(constant.REDIS.PORT, constant.REDIS.ADDRESS, {}); // Redis server started at port 6379
// if (constant.REDIS.PASSWORD) {
//     redisClient.auth_pass(constant.REDIS.PASSWORD);
// }
// redisClient.on("error", function (error) {
//     console.error('redis:', error);
// });


// module.exports = {
//     /**
//     * 设置缓存
//     * @param {string} key 缓存 键
//     * @param {object} value 缓存数据
//     * @param {number} expire 缓存时间(秒)
//     */
//     set(key, value, expire) {

//         redisClient.set(key, value, redis.print)
//     },
//     /**
//      * 获取缓存数据
//      * @param {string} key 缓存 键
//      * @returns 存储的数据
//      */
//     async get(key) {
//         return new Promise((resolve, reject) => {
//             redisClient.get(key, (err, doc) => {
//                 if (err) {
//                     reject(err);
//                 } else {
//                     resolve(doc);
//                 }
//             });
//         });
//     },
//     /**
//      * 删除指定缓存
//      * @param {string} key 缓存 键
//      */
//     remove(key) {
//         redisClient.del(key).then(err => {
//             console.warn(`移除缓存:${key}执行结果:${err}`);
//         })
//     },
//     /**
//       * 清理所有缓存
//       */
//     clear() {
//         redisClient.flushDb().then(err => {
//             console.warn(`清空缓存:${err}`);
//         })
//     }
// }

//--------------------------------------------------------------------------------------------

const _tool = require('../../utils/tool')

const caches = {}

module.exports = {
    /**
     * 设置缓存[√]
     * @param {string} key 缓存 键
     * @param {object} value 缓存数据
     * @param {number} expire 缓存时间(秒)[默认一小时:60*60*1000]
     */
    set(key, value, expire = 60 * 60 * 1000) {
        console.log(`设置缓存:${key} 到期时间:${_tool.dateFormat(new Date(Date.now() + expire))}`);
        caches[key] = {
            val: value,
            expire: expire * 1000,
            time: Date.now()
        }
        console.log('caches[key]',caches[key])
    },
    /**
     * 获取缓存数据[√]
     * @param {string} key 缓存 键
     * @returns 存储的数据
     */
    get(key) {
        console.log('读取缓存:', key);
        let object = caches[key];
        if (!object) {
            return null;
        }
        if (object.time + object.expire > Date.now()) {
            return object.val
        }
        this.remove(key);
        return null
    },
    /**
     * 清理所有缓存[√]
     */
    clear() {
        console.log('清理缓存!');
        console.log('前:',caches)
        Object.keys(caches).forEach(val=>{
            delete caches[val]
        })
        console.log('后:',caches)
    },
    /**
     * 移除指定缓存数据[√]
     * @param {string} key 缓存 键
     */
    remove(key) {
        console.log('移除缓存:', key);
        delete caches[key];
    }
}