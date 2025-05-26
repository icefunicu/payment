/**
 * 支付接口
 */

module.exports = {
    /**
     * 表单形式
     */
    PostType: {
        /**
         * url 链接
         * [本系统直接转向到这个地址]
         */
        GET: 'get',
        /**
         * json
         * [直接输出json格式数据,更符合接口文档]
         */
        JSON: 'json',
        /**
         * 表单html代码
         * [向页面输出一个隐藏表单,并自动提交这个表单,实际是向上游POST数据]
         */
        FORM: 'form',
        /**
         * post 访问
         */
        POST: 'post',
        /**
         * 扫码
         * [上游返回二维码地址,直接展示在本系统页面]
         */
        QRIMG: 'qrimg',
        /**
         * 二维码数据 自己生产图片
         * [上游返回的是二维码数据,本系统自己生产图片并展示]
         */
        QRCODE: 'qrcode',
        /**
         * 向指定账号转账
         * [包括 支付宝 微信 银行卡]
         */
        TRANSFER:'transfer',
    },
    /**
     * 回调类型
     */
    CallBackType: {
        /**
         * 同步
         */
        Sync: '同步',
        /**
         * 异步
         */
        Asyn: '异步'
    },
    /**
     * 回调结果
     */
    CallBackResults() {
        return {
            /**
             * 回调信息
             */
            Message: '',
            /**
             * 是否成功
             */
            IsSuccess: false,
            /**
             * 回调订单
             */
            CallBackOrder: this.CallBackOrder()
        }

    },
    /**
     * 生产订单结果
     */
    BuildResults() {
        return {
            /**
             * 表单信息
             */
            Html: '',
            /**
             * 是否成功
             */
            IsSuccess: false,
            /**
             * 请求方式
             */
            PostType: this.PostType.GET
        }
    },
    /**
     * 回调订单
     */
    CallBackOrder() {
        return {
            /**
             * 系统订单号
             */
            Order: '',
            /**
             * 实际支付金额
             */
            Money: 0.0
        }
    },
    /**
     * 接口名称
     */
    Name: "",
    /**
     * 接口版本
     */
    Version: '',
    /**
     * 接口唯一编码[不能与其他接口重复]
     */
    Away: '',
    /**
     * 异步通知成功时,返回给上游的信息
     */
    NotifySuccessMessage: '',
    /**
     * 接口描述信息
     */
    Describe: '',
    /**
     * 需要的参数
     */
    Args: [],
    /**
     * 支持的渠道
     */
    Gateways: [],
    /**
     * 初始化接口
     * @param {Arrer} _args 接口需要的参数
     */
    Init: function (_args) {

    },
    /**
    * 生产表达,用于提交参数
    * @param {String} oid 订单编号
    * @param {Float} money 金额
    * @param {String} title 订单标题
    * @param {String} describe 订单描述
    * @param {String} type 使用的渠道代码
    * @param {Request} req 请求体[用于获取其他参数]
    */
    async Build(oid, money, title, describe, type, req) { },
    /**
    * 验证回调
    * @param {CallBackType} _callBackType 回调类型     
    * @param {Request} req 请求体      
    * @returns 
    */
    async Validation(_callBackType, req) { }
}