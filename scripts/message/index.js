/**
 * ws 即时通讯[系统]
 */

const constant = require('../../config/constant');
const mongo = require('../../config/database');
const pool = require('./socket_manage')


module.exports = {
    /**
     * 消息处理
     * @param {express} app 应用
     */
    start(app) {
        const server = require('http').Server(app);

        /**
         * 统一配置
         */
        var io = require('socket.io')(server,
            {
                pingTimeout: 1000 * 5,
                pingInterval: 25000 / 2,
                upgradeTimeout: 15000,
                maxHttpBufferSize: 1e8,
                allowRequest: (req, callback) => {
                    callback(null, true);
                }
            });
        const wrap = middleware => (io, next) => middleware(io.request, {}, next);
        io.use(wrap(mongo.SessionStore));

        pool.init(io);

        /******* 独立组件  *****************************************************/
        /**
         * 管理员消息
         */
        io.of('/msg_admin').on('connection', function (socket) {
            pool.join(socket)
            socket.on('disconnect', function (message) {
                pool.leave(socket, message);
            });

            socket.on('message', function (data) {
                console.log('收到管理员信息', data)
            });
        });

        /**
         * 商户后台
         * 商户只处理与自己有关信息
         */
        io.of('/msg_customer').on('connection', function (socket) {
            console.log('mb', socket)
            socket.on('disconnect', function (message) {
                pool.leaveRooms(socket.id)
                pool.broadcast(socket, { 'type': 'user leave', 'message': '商户?登录了' });
            });
            /**
             * 商户成功连接后 传递商户UID
             */
            socket.on('join', function (data) {
                //商户加入房间:
                pool.rooms(socket, data);

                //当有商户登录时,通知管理员
                pool.broadcast(socket, { 'type': 'user login', 'message': `商户:${data.name}进入系统` });
            });

            //当商户发送消息时候
            socket.on('mxs', function (data) {
                console.log('客户端发来数据:', data);
                pool.broadcast(socket, data);
            });
        });

        /**
         * 启动服务器 同时启动ws 端口相同,也可设置不同端口  
         */
        app.listen = function (port, host, func) {
            console.log('web-socket 已启动')
            return server.listen(port, host, func);
        }
    }
}