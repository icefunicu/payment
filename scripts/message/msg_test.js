/**
 * 测试模块
 */
module.exports = function (socket) {
    socket.on('message', function (data) {
        console.log('客户端发来数据:',data); 
    });
    //向客户端发送数据
    socket.emit('dahai', { name: 'aaa', age: 34 });
    socket.send({ success: true, message: '已成功建立连接-message' });

}