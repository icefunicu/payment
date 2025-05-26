/**
 * 客户端[商户]
 */
 window.USER = {};
({
    url: sucpath+'/scoket/auth',
    type: 'POST',
    data: {},
    success: function (res) {
        if(res.success){
            delete res.success
            //连接
            const socket = io('/msg_customer');
            socket.on("connection", (socket) => {
                console.log('connection', socket.id);
                socket.emit("mxs", "world 000");
                socket.emit('mxs', 'i am join');
            });
            // client-side
            socket.on("connect", () => {
                socket.emit('join',res);
            });
            socket.on("disconnect", () => {
                //console.log('disconnect', socket.id);
            }); 
            socket.on("message", (arg) => {
                //console.log(arg); // world
                //socket.emit('mxs', 'i am join');
            });
           
            window.USER = res;
            window.SOCKET = socket;
        }
    }
})
function mxSend(data) {
    if(window.SOCKET){
        window.SOCKET.emit('mxs', data);
    }
}