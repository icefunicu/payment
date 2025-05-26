/**
 * 前台存储库
 */
var Sals = Sals || {}

Sals.prototype.LocalDB = {
    setItem: function (key, value) { 
        window.localStorage.setItem(key, value)
    },
    getItem: function (key) {
        return window.localStorage.getItem(key)
    },
    removeItem: function (key) {
        window.localStorage.removeItem(key);
    },
    clear: function () {
        window.localStorage.clear()
    }
};


Sals.prototype.IndexDB = (function () {
    var self = this;
    self.ready = function () { }
    /**
     * 初始化数据库
     */
    this.init = function (param) {
        this.dbName = param.dbName;
        this.dbVersion = param.dbVersion;
        self.dbStoreName = param.dbStoreName;
        if (!window.indexedDB) {
            console.log('浏览器不支持indexedDB')
        }
        var request = indexedDB.open(this.dbName, this.dbVersion);
        // 打开数据库失败
        request.onerror = function (event) {
            console.log('数据库打开失败,错误码：', event)
        }
        // 打开数据库成功
        request.onsuccess = function (event) {
            // 获取数据对象
            self.db = event.target.result;
            self.ready()
        }
        // 创建数据库
        request.onupgradeneeded = function (event) {
            self.db = event.target.result;
            self.db.createObjectStore(self.dbStoreName, {
                //  keyPath: "id", //设置主键 设置了内联主键就不可以使用put的第二个参数(这里是个坑)
                autoIncrement: true // 自增
            });
        }
    }

    var getStore = function (dbStoreName, mode) {
        var ts = self.db.transaction(dbStoreName, mode);
        return ts.objectStore(dbStoreName);
    }
    /**
     * 添加和修改数据
     */
    this.save = function (...arg) {
        var args = {};
        args.obj = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            if (typeof arguments[i] != 'function') {
                args.secret = arguments[i];
            }

            if (typeof arguments[i] == 'function') {
                args.callback = arguments[i];
            }
        }
        var store = getStore(self.dbStoreName, 'readwrite')
        var request = store.put(args.secret,args.obj);
        request.onsuccess = function () {
            if (typeof args.callback == 'function') {
                args.callback(true, null)
            }
        };
        request.onerror = function (event) {
            if (typeof args.callback == 'function') {
                args.callback(false, event)
            }
        }
    }
    /**
     * 删除数据
     */
    this.delete = function (secret, callback) {
        var store = getStore(self.dbStoreName, 'readwrite')
        var request = store.delete(secret);
        request.onsuccess = function () {
            if (typeof callback == 'function') {
                callback(true, null)
            }
        };
        request.onerror = function (event) {
            if (typeof callback == 'function') {
                callback(false, event)
            }
        }

    }
    /**
     * 查询数据
     */
    this.select = function (secret, callback) {
        var store = getStore(self.dbStoreName, 'readwrite')
        if (secret)
            var request = store.get(secret);
        else
            var request = store.getAll();
        request.onsuccess = function () {
            if (typeof callback == 'function') {
                callback(null,request.result)
            }
        }
        request.onerror = function (event) {
            if (typeof callback == 'function') {
                callback(event, null)
            }
        }
    }
    /**
     * 删除表
     */
    this.clear = function (callback) {
        var store = getStore(self.dbStoreName, 'readwrite')
        var request = store.clear();
        request.onsuccess = function () {
            if (typeof callback == 'function') {
                callback(true)
            }
        }
        request.onerror = function (event) {
            if (typeof callback == 'function') {
                callback(false, event)
            }
        }
    };
});


Sals.prototype.WebSql = (function (options) {
    var self = this;
    options = options || {};
    this.database = null;
    this.DateBaseName = options.DateBaseName || 'SalsNET';
    this.Version = options.Version || '6.09';
    this.Description = options.Description || 'SalsNET';
    this.DataBaseSize = options.DataBaseSize || 1024 * 1024 * 5;

    this.init = function () {
        this.database = window.openDatabase(this.DateBaseName, this.Version, this.Description, this.DataBaseSize); //初始化数

    };
    this.init();
    this.log = function (msg, arg) {
        console.log(msg, arg)
    }
    this.CreateTable = function (tableName, fields) {
        var csql = 'CREATE TABLE IF NOT EXISTS ' + tableName + ' ('
        var field_string = [];
        fields.forEach(function (arg) {
            var file = arg.column + ' '
            file += arg.type;
            if (arg.primary) {
                file += ' primary key'
            }
            if (arg.autoincrement || arg.Autoincrement) {
                file += ' autoincrement'
            }
            field_string.push(file);
        })
        csql += field_string.join(',');
        csql += ');';
        this.Execute(csql, [], function (err, result) {
            if (err) {
                self.log('execute sql fail:', err)
            } else {
                self.log('execute sql ok:', result)
            }
        })
    };

    this.Execute = function (sql, parms, callback) {
        this.database.transaction(function (ctx) {
            ctx.executeSql(sql, parms, function (ctx, result) {
                if (typeof callback == 'function') {
                    callback(null, result)
                }
            }, function (tx, error) {
                self.log('execute sql error:', error);
                if (typeof callback == 'function') {
                    callback(error, false)
                }
            });
        });
    }

    this.Count = function (tableName, filtrate) {
        return new Promise(function (resolve, reject) {
            self.Execute('SELECT COUNT(*) AS C FROM ' + tableName + ' where ' + filtrate, [], function (err, result) {
                if (err) {
                    self.log('execute sql fail:', err)
                } else {
                    resolve(result.rows[0]['C']);
                    self.log('execute sql ok:', result)
                }
            });
        });
    };

    this.Delete = function (tableName, filtrate) {
        return new Promise(function (resolve, reject) {
            self.Execute('DELETE FROM ' + tableName + ' where ' + filtrate, [], function (err, result) {
                if (err) {
                    self.log('execute sql fail:', err)
                } else {
                    resolve(result.rows.length);
                    self.log('execute sql ok:', result)
                }
            });
        });
    };

})


/** */ 