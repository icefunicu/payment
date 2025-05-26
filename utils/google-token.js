/**
 * google 身份验证器
 * 
 */


var speakeasy = require('speakeasy');

module.exports = {
    /**
     * 验证用户 code 是否正确
     * @param {string} code token
     * @param {string} key 用户输入
     * @returns 
     */
    verify(code, key) {
        var verified = speakeasy.totp.verify({
            secret: key,
            encoding: 'base32',
            token: code
        });
        return verified
    },
    /**
     * 创建 KEY
     * @param {string} account 显示的账户
     * @returns 
     */
    create(account) {
        var secret = speakeasy.generateSecret({ name: account, length: 20, symbols: true });
        return secret
    },
}