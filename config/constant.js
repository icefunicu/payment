/**
 * 系统常量
 */

module.exports = {

    /**
     * 启动模式
     */
    StartModel: {
        /**
         * 调试模式
         */
        DEBUG: 'debug',
        /**
         * 生产模式
         */
        PRODUCTION: 'production'
    },
    /**
     * 数据库地址
     */
    DATA_BASE: {
        host: "127.0.0.1",
        port: 27017,
        database: 'test64'
    },

    /**
     * 安装标识文件路径
     */
    SETUP_FILE_PATH: './runtime/install.lock',

    /**
     * 网站 session 的cookie名称
     */
    WEB_SESSION_NAME: "php-session-id",
    /**
     * session 秘钥
     */
    WEB_SESSION_SECRET: 'asd98(*&%ha&^tg^--*&h$%ASD',
    /**
     * 管理员
     */
    ADMIN: "ADMIN",
    /** 管理员后台地址 */
    ADMIN_MANAGE_PATH: '/app/bin',
    /** 完整的退出地址 */
    ADMIN_MANAGE_PATH_LOGIN_OUT_URL: '/app/bin/login-out',
    /** 完整登陆地址 */
    ADMIN_MANAGE_PATH_LOGIN: '/app/bin/login',
    /** 退出地址 */
    ADMIN_MANAGE_PATH_LOGIN_OUT: '/login-out',
    /** 登陆地址 */
    ADMIN_MANAGE_LOGIN: '/login',
    /** 管理员 cookie 名称 */
    ADMIN_MANAGE_COOKIE_NAME: 'php-user-cid',
    /** 管理员密码最少字符数 */
    ADMIN_PASSWORD_LENGTH_MINI: 6,

    /******* 普通用户 ***********************************************************/
    /**
     * 用户
     */
    USER: 'USER',
    /**
     * 普通用户 cookie 名
     */
    USER_COOKIE_NAME: 'php-user-uid',
    /**
     * 后台地址
     */
    USER_HOME_PATH: '/user',
    /**
     * 登陆地址
     */
    USER_LOGIN_FULL_PATH: "/user/login",
    /** 密码最小位数 */
    USER_PASSWORD_LENGTH_MINI: 6,

    /******* 商户 ***********************************************************/

    /**
     * 后台地址
     */
    CUSTOMER_MANAGE_PATH: '/customer',
    /**商户类型 */
    CUSTOMER: 'CUSTOMER',
    /**商户cookie名 */
    CUSTOMER_COOKIE_NAME: 'ss_nur_php_name',
    /**商户登录地址 */
    CUSTOMER_LOGIN_PATH: '/customer/login',
    /**密码最小位数 */
    CUSTOMER_PASSWORD_LENGTH_MINI: 8,
    /******* 文件上传  *************************************************** */

    /**上传文件时,使用的字段名称,前台不一致时,不上传 */
    FILE_UPLOAD_FIELDNAME: 'file',
    /**
     * 上传的文件存放目录
     */
    FILE_STORE: "./runtime/resources",
    /**
     * 临时文件目录
     */
    TEMP_DIR: "./runtime/resources/temp",
    /**
     * 文件资源 数据库集合 名称 (数据库中)
     */
    RESOURCES_STORE: "resources",

    /**这些类型的文件 不存储到服务器 直接抛弃(不做上传处理 也不报错) */
    ABANDON_FILE_EXTS: ['exe', 'com', 'vb', 'bat' , 'sh'],

    /******* 系统日志文件  *************************************************** */

    /**
     * 日志文件目录
     */
    LOG_FILE_DIR: "./runtime/logs",


    /******* 系统备份  *************************************************** */

    /**
     * 备份文件目录
     */
    BACKUP_FILE_DIR: './runtime/backups',
    /**
        * 备份网站时排除的文件夹 不备份这些文件夹
        */
    BACKUP_SITE_EXCLUDE: ['etc', 'node_modules', 'setting', 'runtime', 'resources', 'log', 'logs', 'temp', 'backups', '.vscode', '.git'],


    /******* 缓存服务  *************************************************** */

    /**
     * redis 服务
     */
    REDIS: {
        /**
         * 是否启用
         */
        USE: false,
        ADDRESS: '127.0.0.1',
        PORT: 6555,
        PASSWORD: false
    },
    /**
     * 异步通知最大次数
     */
    NOTIDY_POST_COUNT: 5,
    /**
    * 异步通知 正确结果返回值
    */
    NOTIDY_SUCCESS_STRING: 'success',


}