/**
 * 插件系统
 * [所有插件应与此相同,系统才可以动态调用]
 */
module.exports = {
    /**
     * 插件名称
     */
    Name: '插件名称',
    /**
    * 版本
    */
    Version: '1.0.1',
    /**
     * 描述信息
     */
    Describe: '插件作用描述',
    /**
     * 参数配置界面帮助文字
     * [支持html代码]
     */
    Help: '<span class="red">asdasd</span>',
    /**
    * 参数
    */
    Args: [{ name: '', text: '', val: '' }],
    /**
     * 插件入口程序
     * @param {Arrer} _args 插件需要的参数
     */
    Main: function (_args, req, res) {
        this._args = _args;
    }
}