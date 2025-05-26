/**
 * 会话管理[系统]
 */
const _lodash = require('lodash')
const sockets = [];
const users = [];

function roomChange() {
    let us = []
    _lodash(users).forEach(u => {
        us.push(u.user)
    })
    _lodash(sockets).forEach(val => {
        if (val.connected) {
            val.emit('room', us);
        }
    });
}
module.exports = {
    /**
     * 初始化系统socket
     * @param {Server} socket 系统
     */
    init(io) {

    },
    /**
     * 管理员进入系统
     * @param {socket.io} socket 会话对象
     */
    join(socket) {
        sockets.push(socket)
    },
    /**
     * 商户进入系统 
     */
    rooms(socket, user) {
        let hasUser = _lodash(users).find(val => { return val.user.uid == user.uid });
        if (hasUser) {
            hasUser.socket = socket
        } else {
            users.push({ id: socket.id, user, socket });
        }

        console.log(`当前在线:${users.length}`);
        roomChange();
    },
    /**
     * 商户离开系统
     */
    leaveRooms(socketId) {
        _lodash(users).forEach(val => {
            if (val.id == socketId) {
                users.pop(val);
            }
        })
        console.log(`当前在线:${users.length}`);
        roomChange();
    },
    /**
     * 商户离开
     * @param {*} socket 对象
     * @param {string} message 信息 
     */
    leave(socket, message) {
        console.log('level', socket)
        sockets.pop(socket)
    },
    /**
     * 广播给全部管理员
     * @param {*} socket 
     */
    broadcast(socket, data) {
        _lodash(sockets).forEach(val => {
            val.emit('adb', data);
        });
    }
}