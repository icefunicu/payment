/**
 * mongoDB 数据库
 */

const constant = require('../constant')
let mongojs = require('mongojs');
let mongodb_server = `mongodb://${constant.DATA_BASE.host}:${constant.DATA_BASE.port}`;
let mongoStore = require('connect-mongo');
let db = mongojs(`${mongodb_server}/${constant.DATA_BASE.database}`, [], { serverSelectionTimeoutMS: 10700 * 5 });

db.on('connect', function () {
    console.info('mongodb connect ok');
})
db.on('close', function () {
    console.info('mongodb close ');
})
db.on('error', function (a, b, c) {
    console.info('mongodb error ', a, b, c);
})
db.on('connection', (stream) => {
    console.info('mongodb connection ', stream);
})


module.exports = {
    /**
     * 升序
     */
    SORT_AESC: 1,
    /**
     * 降序
     */
    SORT_DESC: -1,
    /**
     * 数据库实例
     */
    Instance: db,
    /**
     * 转换mongoDB唯一ID
     * @param {string} objectId object-id 的字符串形式
     * @returns object-id的mongoDB可识别形式
     */
    ObjectId: function (objectId) {
        try {
            return mongojs.ObjectId(objectId);
        } catch (e) {
            return new mongojs.ObjectId()
        }

    },
    /**
     * session 
     */
    SessionStore: mongoStore.create({
        mongoUrl: mongodb_server,
        mongoOptions: {
            connectTimeoutMS: 60,
            waitQueueTimeoutMS: 120,
            // auth:{
            //     username:'username',
            //     password:'password'
            // }
        },
        crypto: {
            secret: constant.WEB_SESSION_SECRET
        },
        autoRemove: 'interval',
        autoRemoveInterval: 60 * 24,
        dbName: 'ex-session',               //数据库名称
        collectionName: 'socket-session',   //集合名称
        ttl: 3                              // time period in seconds
    }),
    /**
     * 集合操作
     * @param {string} collection 集合名称
     * @returns Promise
     */
    Coll: function (collection) {
        /**
         * 所有集合增加前缀
         */
        let obj = db['sals_' + collection];
        if (process.env.NODE_ENV ==constant.StartModel.DEBUG) {
            //console.log('访问数据库:', collection);
        }

        return {
            /**
             * 异步查询
             * @param {object} query 查询条件
             * @param {object} projection 
             * @param {object} opts 配置
             * @param {function} cb 回调函数
             * @returns this
             */
            find(query, projection, opts, cb) {
                return obj.find(query, projection, opts, cb);
            },
            /**
             * 查询一个文档
             * @param {*} query 
             * @param {*} projection 
             * @returns 
             */
            async findOne(query, projection) {
                return new Promise((resolve, reject) => {
                    obj.findOne(query, projection, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async findAndModify(opts) {
                return new Promise((resolve, reject) => {
                    obj.findAndModify(opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async count(query) {
                return new Promise((resolve, reject) => {
                    obj.count(query, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async distinct(field, query) {
                return new Promise((resolve, reject) => {
                    obj.distinct(field, query, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async insert(docOrDocs, opts) {
                return new Promise((resolve, reject) => {
                    obj.insert(docOrDocs, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async insertOne(doc, opts) {
                return new Promise((resolve, reject) => {
                    obj.insertOne(doc, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async insertMany(docs, opts) {
                return new Promise((resolve, reject) => {
                    obj.insertMany(docs, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async update(query, update, opts) {
                return new Promise((resolve, reject) => {
                    obj.update(query, update, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            /**
             * 更新单个文档
             * @param {*} query 查询条件
             * @param {*} update 更改的对象
             * @param {*} opts {upsert:true/false}
             * @returns 
             */
            async updateOne(query, update, opts) {
                return new Promise((resolve, reject) => {
                    obj.updateOne(query, update, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async updateMany(query, update, opts) {
                return new Promise((resolve, reject) => {
                    obj.updateMany(query, update, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },

            async save(doc, opts) {
                return new Promise((resolve, reject) => {
                    obj.save(doc, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async replaceOne(query, update, opts) {
                return new Promise((resolve, reject) => {
                    obj.replaceOne(query, update, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },

            async remove(query, opts) {
                return new Promise((resolve, reject) => {
                    obj.remove(query, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async rename(name, opts) {
                return new Promise((resolve, reject) => {
                    obj.rename(name, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async drop() {
                return new Promise((resolve, reject) => {
                    obj.drop(function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async stats() {
                return new Promise((resolve, reject) => {
                    obj.stats(function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async mapReduce(map, reduce, opts) {
                return new Promise((resolve, reject) => {
                    obj.mapReduce(map, reduce, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async runCommand(cmd, opts) {
                return new Promise((resolve, reject) => {
                    obj.runCommand(cmd, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async dropIndexes() {
                return new Promise((resolve, reject) => {
                    obj.dropIndexes(function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async dropIndex(index) {
                return new Promise((resolve, reject) => {
                    obj.dropIndex(index, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async createIndex(index, opts) {
                return new Promise((resolve, reject) => {
                    obj.createIndex(index, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async ensureIndex(index, opts) {
                return new Promise((resolve, reject) => {
                    obj.ensureIndex(index, opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async getIndexes() {
                return new Promise((resolve, reject) => {
                    obj.getIndexes(function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async reIndex() {
                return new Promise((resolve, reject) => {
                    obj.reIndex(function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async isCapped() {
                return new Promise((resolve, reject) => {
                    obj.isCapped(function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async group(doc) {
                return new Promise((resolve, reject) => {
                    obj.group(doc, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            aggregate: obj.aggregate,
            async initializeOrderedBulkOp(opts) {
                return new Promise((resolve, reject) => {
                    obj.initializeOrderedBulkOp(opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },
            async initializeUnorderedBulkOp(opts) {
                return new Promise((resolve, reject) => {
                    obj.initializeUnorderedBulkOp(opts, function (err, doc) {
                        if (err) {
                            reject(err);
                            return
                        }
                        resolve(doc);
                    });
                })
            },

            toString() {
                return obj.toString();
            }
        }
    }
}



