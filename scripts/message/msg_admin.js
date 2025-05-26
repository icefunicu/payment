/**
 * 管理员后台消息中心
 * @param {string} path 路径
 * @param {socket.io} io server 对象
 */
module.exports = function (path, io) {
    io.of(path).on('connection', function (socket) {
        //console.log('admin socket',socket)


        socket.join('sok-admin-room');
        socket.on('disconnect', function (timeout) {
            socket.leave('sok-admin-room');
        });
        
        socket.emit('newClientConnect', '666666666666666666')

        //console.log('222, 管理员后台');
        socket.emit('message', 'can you hear me?');
        socket.on('message', function (data) {
            console.log('客户端发来数据:',data); 
        });
        socket.on('asd', socket => {
            //console.log('asd');
        }).on('www', socket => {
            //console.log('www');
        })
    });

}