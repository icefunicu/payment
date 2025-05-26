/**
 * HTTP 请求
 */
const axios = require('axios');

axios.defaults.timeout = 1000 * 20;//20 秒
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36 Edg/100.0.1185.36'
axios.defaults.headers.withCredentials = false;//表示跨域请求时是否需要使用凭证
axios.defaults.headers.maxRedirects = 5;//最大重定向数目


module.exports = {
    /**
     * GET 请求
     */
    get: axios.get,
    /**
     * POST 请求
     */
    post: axios.post,

    /**
     * 自定义请求
     */
    request: axios,

    Axios: new axios.Axios()
}