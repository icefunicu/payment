$('form.post-form').ajaxForm({
    type: "POST",
    dataType: "json",
    iframe: false,
    timeout: 1000 * 60 * 5,
    //最长 5 分钟等待时间
    beforeSubmit: function (formData, jqForm, options) {
        if (!$(jqForm).data('tip-show') == 'false') {
            tip('处理中,请稍后...', 4)
        }
        formData[formData.length] = {
            name: '_r',
            value: Math.random(),
            type: 'text',
            required: true
        }
        formData._r = Math.random();
    },
    error: function (xhttp, type, message, $form) {
        //提交失败后执行的回调函数
        tip(message, 3);
    },
    success: function (xhttp, statusText, xhr, $form) {
        if (xhttp.login) {
            tip(xhttp.message,$form.data('tip-show') != 'false');
            setTimeout(function () {
                tip(xhttp.message,$form.data('tip-show') != 'false');
                top.location.replace(xhttp.path);
            }, 2000);
            return;
        }
        if (typeof callAjaxForm == 'function') {
            callAjaxForm(xhttp);
            return;
        } else {
            if (xhttp.success) {
                tip(xhttp.message,1,$form.data('tip-show') != 'false');
            } else {
                tip(xhttp.message, 2,$form.data('tip-show') != 'false');
            }
        }
    }
})

$('.btn-post').on('click', function () {
    $(this).parents('form.post-form').trigger('submit');
})
window.alert = function (msg, callback) {
    top.fyAlert.alert({
        drag: true,
        shadow: [0.3, '#000'], //遮罩 
        skin: 'fyAlert-blue',
        title: '系统提示',
        content: msg,
        btns: {
            '好': function (obj) {
                if (typeof callback == 'function') {
                    callback();
                }
                obj.destory();
            },
            '取消': function (obj) { obj.destory(); }
        },
    })
}
window.tip = function (msg, icon = 1, closed = true) {
    if (closed) {
        top.$('.fy-alert-shadow').remove();
        top.$('.fy-alert-box').remove();
    }
    top.fyAlert.alert({
        title: false, //标题
        icon: icon,
        skin: 'fy-blue',
        content: msg,    //内容 
        position: 'fixed',//定位方式
        closeBtn: false,   //是否显示关闭按钮
        type: 1,      //type=2 为iframe
        drag: false,   //是否开启拖动
        time: 3000,   //当无头或无底部按钮时自动关闭时间
        shadow: [0.3, '#000'], //遮罩
        shadowClose: true,  //是否点击遮罩关闭
        animateType: 1, // 0为默认动画 1为底部弹出 2为顶部弹出 3为左部弹出 4为右部弹出
        aniExtend: '',   //例 css动画名 opacity
        area: ['auto', 'auto'], //设置宽高
        minmax: false,
        direction: ['center', 'center'], //方向 key1:right left center  key2: top bottom center
    })
}
window.ajax = function (url, data, callback) {
    $.ajax({
        url: url,
        data: data,
        type: 'POST',
        timeout: 1000 * 60 * 5,
        dataType: "json",
        beforeSend: function (formData, jqForm, options) {
            tip('处理中,请稍后...', 4)
        },
        error: function (xhttp, type, message, $form) {
            tip(message, 3);
        },
        success: function (res) {
            if (typeof callback == 'function') {
                callback(res);
            }
        }
    })
}
window.money = function (price) {
    price = parseFloat(price).toFixed(2)
    return '¥' + String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
window.orderDetails = function (url) {
    top.fyAlert.alert({
        type: 2,
        shadow: [0.3, '#000'], //遮罩
        title: '订单详情',
        animateType: 1,
        area: ['50%', '60%'],
        content: url,
        btns: {                  //按钮组
            '关闭': function (obj) {
                obj.destory(); //销毁
            }
        },
    })
}
window.dateTime = function (date, fmt) {
    if (!date) { return '' }
    fmt = fmt || 'yyyy-MM-dd hh:mm:ss';
    date = new Date(date)
    if (isNaN(date.valueOf())) return ''
    var o = {
        "M+": date.getMonth() + 1,                      //月份
        "d+": date.getDate(),                           //日
        "h+": date.getHours(),                          //小时
        "m+": date.getMinutes(),                        //分
        "s+": date.getSeconds(),                        //秒
        "q+": Math.floor((date.getMonth() + 3) / 3),    //季度
        "S": date.getMilliseconds()                     //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }

    return fmt;
}