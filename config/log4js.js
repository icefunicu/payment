/**
 * log4j 配置文件
 * 
 */
const constant = require('./constant')
 
module.exports = {

    pm2: process.argv.includes('PM2'),
    pm2InstanceVar: process.argv.includes('PM2') ? 'INSTANCE_ID' : '',
    disableClustering: process.argv.includes('PM2'),

    "appenders": {
        "http-record": {
            "type": "dateFile",
            "filename": constant.LOG_FILE_DIR + "/http-record.log",
            "pattern": "yyyy-MM-dd.log"
        },
        "http-console": {
            "type": "console",
            "layout": {
                "type": "colored"
            }
        },
        "default": {
            "type": "dateFile",
            "filename": constant.LOG_FILE_DIR + "/default.log",
            "maxLogSize": 10485760,
            "pattern": "yyyy-MM-dd.log",
            "numBackups": 3
        },
        "application": {
            "type": "dateFile",
            "filename": constant.LOG_FILE_DIR + "/application.log",
            "maxLogSize": 10485760,
            "pattern": "yyyy-MM-dd.log",
            "numBackups": 3,
            "category": "app"
        },
        "errorFile": {
            "type": "dateFile",
            "filename": constant.LOG_FILE_DIR + "/errors.log",
            "pattern": "yyyy-MM-dd.log",
            "category": "error"
        },
        "errors": {
            "type": "logLevelFilter",
            "level": "ERROR",
            "appender": "errorFile",
            "category": "error"
        },
        "paymeny": {
            "type": "dateFile",
            "filename": constant.LOG_FILE_DIR + "/paymenys.log",
            "pattern": "yyyy-MM-dd.log",
            "category": "paymeny"
        }
    },
    "categories": {
        "default": {
            "appenders": [
                "default"
            ],
            "level": "ALL"
        },
        "errors": {
            "appenders": [
                "errors"
            ],
            "level": "ERROR"
        },
        "application": {
            "appenders": [
                "application"
            ],
            "level": "ALL"
        },
        "paymeny": {
            "appenders": [
                "paymeny"
            ],
            "level": "ALL"
        },
        "http": {
            "appenders": [
                "http-record"
            ],
            "level": "ALL"
        },
        "http-console": {
            "appenders": [
                "http-console"
            ],
            "level": "ALL"
        }
    }
}