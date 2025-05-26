/**
 * 短信接口配置
 */

const http = require("../../utils/http");
const tool = require("../../utils/tool");
const cache = require('../system/cache-store');

/**
 * 目前使用 https://www.sms.cn/sms_api.html 服务
 * 可根据实际情况更换其他服务商
 */

module.exports = {
    /**
     * 接口版本
     */
    Version: '1.0',
    /**
     * 发送类型
     */
    Template: {
        /**
         * 验证码
         */
        VERIFICATION: 1,
        /**
         * 提款到账通知
         */
        CASHS: 2
    },
    Args: [
        { name: 'sms_uid', text: '用户账号', val: '登录名' },
        { name: 'sms_pwd', text: '登录密码', val: '登录名' },
        { name: 'sms_tp_VERIFICATION', text: '模板ID[验证码]', val: '填写对应的模板ID号' },
        { name: 'sms_tp_CASHS', text: '模板ID[提款导致通知]', val: '填写对应的模板ID号' },
    ],
    /**
     * 发送验证码
     * @param {string} mobile 手机号
     * @param {number} number 验证码
     */
    post(mobile, number) {
        cache.getConfig().then(c => {
            if (c && c.sns_port_use && c.sms_uid) {
                let pwd = tool.md5(c.sms_uid + c.sms_pwd);
                let postUrl = `http://api.sms.cn/sms/?ac=send&uid=${c.sms_uid}&pwd=${pwd}&mobile=${mobile}&template=${c.sms_tp_VERIFICATION}&content={"key":"${number}"}`;
                http.post(postUrl).then(a => {
                    console.log('短信发送成功!');
                }).catch(x => {
                    console.error('短信API异常:', x)
                });
            }
        }).catch(e => {
            console.error('获取短信参数异常:', e)
        });
    },

    /**
     * 发送通知
     * @param {string} mobile 手机号
     * @param {number} type 通知类型
     */
    notify(mobile, type) {

        let content = '';
        switch (type) {
            case this.Template.CASHS:
                content = "提款到账";
                break;
            case this.Template.VERIFICATION:
            default:
                content = "";
                break;
        }

        cache.getConfig().then(c => {
            if (c && c.sns_port_use && c.sms_uid) {
                let pwd = tool.md5(c.sms_uid + c.sms_pwd);
                let postUrl = `http://api.sms.cn/sms/?ac=send&uid=${c.sms_uid}&pwd=${pwd}&mobile=${mobile}&template=${c.sms_tp_CASHS}&content={"key":"${number}"}`;
                http.post(postUrl).then(a => {
                    console.log('短信发送成功!');
                }).catch(x => {
                    console.error('短信API异常:', x)
                });
            }
        }).catch(e => {
            console.error('获取短信参数异常:', e)
        });

    }

}