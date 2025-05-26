/**
 * 客户端[管理员]
 */

var Message = (function (path) {

    this.Receive = function () { };
    this.Send = function (data) {
        client.send(data)
    }
    /**
     * 增加自定义监听事件
     * @param {string} eventName 自定义监听事件
     * @param {function} callback 回调函数
     */
    this.Listening = function (eventName, callback) {
        if ('message' == eventName) return;
        client.on(eventName, callback);
    }

    //socket pool
    var manager = new io.Manager({
        reconnection: true,
        autoConnect: true,
        reconnectionDelayMax: 4,
        reconnectionDelay: 333,
        timeout: 1000,
        withCredentials: true
    });
    var $this = this;
    
    //连接到 ? 地址 
    var client = manager.socket(path, {});

    //#region  事件

    client.on('connect_error', function (error) {
        //console.log('链接 错误')
    });
    client.on('disconnect', function (timeout) {
        //console.log('链接断开')
    });
    client.on('ping', function (timeout) {
        //console.log('ping')
    });
    client.on('reconnecting', function (timeout) {
        //console.log('正在重新链接')
    });
    client.on('reconnect', function (timeout) {
        //console.log('成功 重连')
    });
    client.on('connect', function (data) {
        //console.log('链接到服务器');
    });
    client.on('message', function (data) {
        $this.Receive(data);
    });
    //#endregion


    return this;
});



var msg = new Message('/msg_admin');
var audio = mp3('/audio/dd.mp3', false);//提示语音
msg.Listening('audio', function (data) {
    audio.play();
})

msg.Listening('adb', function (data) {
    console.log('adb data', data)

})
function mp3(path, loop = false) {
    var audio = new window.Audio(path);
    audio.loop = loop;
    return {
        play: function () {
            audio.play();
        },
        pause: function () {
            audio.pause();
        }
    }
}