const uuid_ = require('uuid');
const crypto_ = require('crypto');
const http = require('./http');
const _path = require('path')
const fs = require("fs");
const _lodash = require('lodash');
const path = require('path');
const constant = require('../config/constant');


module.exports = {

    /**
     * 读取JSON文件
     * @param {string} path json 文件位置
     * @returns JSON 对象
     */
    getJSON(path) {
        try {
            let rawdata = fs.readFileSync(_path.resolve(path));
            return JSON.parse(rawdata.toString());
        } catch (ex) {
            console.error(`无法读取文件:${path} ===> ${ex}`)
            return {};
        }
    },
    /**
     * 读取文本文件
     * @param {string} path 文件位置
     * @returns 文本文件
     */
    getFile(path) {
        try {
            let rawdata = fs.readFileSync(_path.resolve(path));
            return rawdata.toString();
        } catch (ex) {
            return {};
        }
    },
    /**
     * 获取时间
     * 该时间为网络时间，用于校准
     */
    async getTime() {
        // 备用api
        // https://quan.suning.com/getSysTime.do
        // https://cube.meituan.com/ipromotion/cube/toc/component/base/getServerCurrentTime

        let res = await http.get('http://acs.m.taobao.com/gw/mtop.common.getTimestamp/');

        return {
            timestamp: parseInt(res.data.data.t),
            datetime: new Date(parseInt(res.data.data.t))
        }
    },

    /**
     * md5 加密
     * @param {String} str 要签名的字符串
     * @returns 
     */
    md5: (str) => {
        return crypto_.createHash('md5').update(str).digest("hex").toString();
    },
    /**
     * json 序列化为web参数形式
     * @param {JSON} jon json 参数
     */
    stringify: (jon) => {
        let parm = []
        for (k in jon) {
            parm.push(k + '=' + jon[k])
        }
        return parm.join('&')
    },
    /**
     * guid 版本【1，3，4，5】
     * @param {number} v guid 版本【1，3，4，5】
     * @returns 
     */
    guid: (v) => {
        switch (v) {
            case 1: return uuid_.v1().toString();
            case 3: return uuid_.v3().toString();
            case 5: return uuid_.v3().toString();
            case 4:
            default:
                return uuid_.v4().toString();
        }
    },
    /**
     * 获取本服务器IP信息
     * @param {string} ip ipv4 格式IP{空值则查本服务器}
     * @returns ip信息
     */
    async getIp(ip = '') {
        //let api_url =`http://ip-api.com/json/${ip}?lang=zh-CN`;
        let api_url = `https://ip.cn/api/index?ip=${ip}&type=0`;

        let res = await http.get(api_url);
        return {
            success: res.data.rs == 1,

            country: res.data.address.replace('  ', ' ').split(' ')[0],
            city: res.data.address.replace('  ', ' ').split(' ')[1],
            region: res.data.address.replace('  ', ' ').split(' ')[2],

            location: {
                lat: 0.0,
                lon: 0.0
            },
            ip: res.data.ip
        };
        /* 正确结果:

        {success: true, country: '中国', city: '广东省', region: '湛江市', location: {lat:0,lon:0}, ip:'123.182.163.159'}

        */
    },

    /**
     * 生产随机字符
     * @param {number} type 随机类型
     * @param {number} len 字符串长度
     * @returns 
     */
    random(type, len) {
        switch (type) {
            case 1:
                return Math.random();
            case 2:
                return parseInt(Math.random() * len);
            default:
                len = len || 32;
                var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
                var maxPos = $chars.length;
                var pwd = '';
                for (i = 0; i < len; i++) {
                    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
                }
                return pwd;
        }
    },
    /**
     * 创建或删除 一个临时目录 
     * @param {String} dir 如果是一个目录则删除该目录,否则创建一个新目录
     * @returns 
     */
    TempDir(dir) {
        if (dir) {
            fs.rmdirSync(dir, { recursive: true });
            return null;
        }

        let tmpDir = this.random(3, 13);
        return fs.mkdirSync(path.join(constant.TEMP_DIR, tmpDir), { recursive: true });//创建临时目录
    },
    /**
     * 比较两个版本号
     * @param {String} v1 版本号
     * @param {String} v2 版本号
     * @returns v1 < v2 = -1 ;v1=v2 = 0 ; v1 > v2 = 1
     */
    VerCompare(v1, v2) {
        //补位0，或者使用其它字符
        const ZERO_STR = '000000000000000000000000000000000000000000';
        if (v1 === v2) {
            return 0;
        }
        let len1 = v1 ? v1.length : 0;
        let len2 = v2 ? v2.length : 0;
        if (len1 === 0 && len2 === 0) {
            return 0;
        }
        if (len1 === 0) {
            return 1;
        }
        if (len2 === 0) {
            return -1;
        }
        const arr1 = v1.split('.');
        const arr2 = v2.split('.');
        const length = Math.min(arr1.length, arr2.length);
        for (let i = 0; i < length; i++) {
            let a = arr1[i];
            let b = arr2[i];
            if (a.length < b.length) {
                a = ZERO_STR.substr(0, b.length - a.length) + a;
            } else if (a.length > b.length) {
                b = ZERO_STR.substr(0, a.length - b.length) + b;
            }
            if (a < b) {
                return 1;
            } else if (a > b) {
                return -1;
            }
        }
        if (arr1.length < arr2.length) {
            return 1;
        } else if (arr1.length > arr2.length) {
            return -1;
        }
        return 0;
    },

    /**
     * 文件夹复制
     * @param {String} from 目录源
     * @param {String} to 目标文件夹
     */
    CopyDir(from,to) {
        var fs = require("fs-extra");
        fs.copySync(from, to,{});
    },
    password: {
        /**
         * 密码加密
         * @param {String} pwd 密码明文
         * @returns {String} 加密后密码
         */
        Encoding: function (pwd) {
            var key = crypto_.pbkdf2Sync(pwd + '', 'salsnet', 100000, 512, 'sha512');
            return crypto_.createHash('md5').update(key.toString('hex')).digest("hex").toString();
        },
        Encoding2: function (pwd) {
            var key = crypto_.pbkdf2Sync(pwd + '', 'salsnet', 100000, 512, 'sha512');
            return crypto_.createHash('sha1').update(key.toString('hex')).digest("hex").toString();
        },
        Encoding3: function (pwd) {
            var key = crypto_.pbkdf2Sync(pwd + '', 'pay-code', 100000, 512, 'sha512');
            return crypto_.createHash('sha256').update(key.toString('hex')).digest("hex").toString();
        },
        /**
         * 验证密码是否正确
         * @param {String} pwd 密码明文
         * @param {String} password 数据库密码
         * @returns 
         */

        Validation: function (pwd, password) {
            return this.Encoding(pwd) == password;
        }

    },
    /**
     * 时间格式化
     * @param {Date} date 可转化为时间的数据
     * @param {String} fmt 格式化形式
     * @returns 
     */
    dateFormat(date, fmt = 'yyyy-MM-dd hh:mm:ss') {
        date = new Date(date)
        if (isNaN(date.valueOf())) return ''
        var o = {
            "M+": date.getMonth() + 1,                      //月份
            "d+": date.getDate(),                           //日
            "h+": date.getHours(),                          //小时
            "m+": date.getMinutes(),                        //分
            "s+": date.getSeconds(),                        //秒
            "q+": Math.floor((date.getMonth() + 3) / 3),    //季度
            "S": date.getMilliseconds()                     //毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }

        return fmt;
    },
    /**
     * 格式化金额
     * @param {number} number 数值
     * @returns 
     */
    money(number) {
        return `¥${this.number_format(number, 2, '.', ',')}`;
    },
    /**
     * 数字格式化
     * @param {Number} number 要格式化的数字
     * @param {Number} decimals 保留几位小数
     * @param {String} dec_point 小数点符号
     * @param {String} thousands_sep 千分位符号
     * @returns 格式化后的字符串
     */
    number_format(number, decimals, dec_point, thousands_sep) {
        number = (number + '').replace(/[^0-9+-Ee.]/g, '');
        var n = !isFinite(+number) ? 0 : +number,
            prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
            sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
            dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
            s = '',
            toFixedFix = function (n, prec) {
                var k = Math.pow(10, prec);
                return '' + Math.ceil(n * k) / k;
            };

        s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
        var re = /(-?\d+)(\d{3})/;
        while (re.test(s[0])) {
            s[0] = s[0].replace(re, "$1" + sep + "$2");
        }

        if ((s[1] || '').length < prec) {
            s[1] = s[1] || '';
            s[1] += new Array(prec - s[1].length + 1).join('0');
        }
        return s.join(dec);
    },
    /**
     * 格式化查询条件
     * @param {Array} rules 查询条件
     * @param {string} andORor AND 还是 OR
     * @param {string} opr op 操作符
     * @returns 
     */
    formatQuery(rules, andORor = 'AND', opr = 'op') {
        let query = { '$or': [], '$and': [] };
        let opst = '';
        if (andORor == 'AND') {
            delete query['$or'];
            opst = '$and';
        } else {
            delete query['$and'];
            opst = '$or';
        }

        _lodash(rules).forEach(val => {
            switch (val[opr]) {
                case 'eq':
                    query[opst].push({ [val.field]: val.data });
                    break;
                case 'ne':
                    query[opst].push({ [val.field]: { '$ne': val.data } });
                    break;

                case 'bw':
                    query[opst].push({ [val.field]: { $regex: '/^' + val.data + '/' } });
                    break;
                case 'bn':
                    query[opst].push({ [val.field]: { $regex: '/^(?!' + val.data + ')/' } });
                    break;

                case 'ew':
                    query[opst].push({ [val.field]: { $regex: '/' + val.data + '$/' } });
                    break;
                case 'en':
                    query[opst].push({ [val.field]: { $regex: '/(' + val.data + '?!)/' } });
                    break;

                case 'cn':
                    query[opst].push({ [val.field]: { $regex: '/' + val.data + '/' } });
                    break;
                case 'nc':
                    query[opst].push({ [val.field]: { $regex: '/(?!' + val.data + ')/' } });
                    break;

                case 'nu':
                    query[opst].push({ [val.field]: { $eq: null } });
                    break;
                case 'nn':
                    query[opst].push({ [val.field]: { $ne: null } });
                    break;
                case 'in':
                    query[opst].push({ [val.field]: { $in: val.data } });
                    break;
                case 'ni':
                    query[opst].push({ [val.field]: { $nin: val.data } });
                    break;
            }
        })
        if (query[opst].length < 1) {
            return {};
        }
        return query;
    },
    /**
     * 生产隐藏式表单 并提交
     * @param {String} action 提交的URL
     * @param {object} args 提交的参数 
     * @param {boolean} submit 是否自动提交
     */
    createForm(action, args, submit = true) {
        let formId = this.guid(4);
        let form = `<form id="${formId}" action="${action}" autocomplete="off" spellcheck="false" method="post">\n`;
        _lodash(args).forEach((val, key) => {
            form += `<input type="hidden" name="${key}" value="${val}">\n`;
        })
        //如果不是自动提交,则需要出现提交按钮
        if (!submit) {
            form += `<button type="submit">提交</button>\n`;
        }
        form += `</form>`;
        if (submit) {
            form += `<script type="text/javascript">document.getElementById('${formId}').submit();</script>\n`;
        }
        return form;
    }
}