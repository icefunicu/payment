/**
 * 内嵌页
 */
var Sals = (function () {
    var _self = this;
    /**
     * 初始化
     */
    _self.init = function () {
        /**
         * 长时间不使用
         */
        $(window.document.body).on('keydown click mousemove', function () {
            if (top.layout.LockOperation && !top.layout.isLockLayout) {
                top.layout.LockOperation = !top.layout.LockOperation;
                window.localStorage.setItem('last-use', Date.now());
            }
        });
        /* 默认行为设置 */
        $('select.dropdown').dropdown({ displayType: 'block' });
        $('ui.accordion').accordion({
            selector: {
                trigger: '.title .icon'
            }
        });
        $('.popup-').popup({});
        $('.ui.progress').progress({});
        $('.ui.checkbox').checkbox({});
        $('.tabs.menu .item').tab();
        $('.upload.isimage').on('mousemove', function (e) {
            var $this = $(this);
            if (!$this.hasClass('showing')) {
                $this.addClass('showing');
                var src = $this.val();
                if (src) {
                    var $div = $('<div></div>');
                    $div.addClass('img-preview-box')
                    $div.append('<img src="' + src + '"/>');
                    setTimeout(() => {
                        $div.appendTo(document.body);
                        $div.show();
                        if($this.offset().top - $div.outerHeight()>0){
                            $div.css({ left: $this.offset().left, top: $this.offset().top - $div.outerHeight() });
                        }else{
                            $div.css({ left: $this.offset().left, top: $this.offset().top + $this.outerHeight() });
                        }
                    }, 50);
                }
            }
        }).on('mouseleave', function () {
            var $this = $(this);
            $this.removeClass('showing');
            $('div.img-preview-box').remove()
        });
    }
    /**
     * 通用提示框
     * @param {object} res 服务器返回值
     */
    _self.tip = function (res) {
        if (res.success) {
            top.layout.tip(res.message);
        } else {
            top.layout.notify(res.message, { class: 'error' });
        }
    }
    /**
     * 引入文件并执行
     * @param {Array} files 引入文件列表
     * @param {function} callback 回调列表
     * @returns 
     */
    _self.use = function (files, callback) {
        if (files == '' || files == [] || files == {} || files == null || files == undefined) {
            if (typeof callback == 'function') {
                callback();
            }
            return
        }
        if (typeof files == 'function') {
            files();
            return
        }

        var links = [];
        if (typeof files == 'object') {
            files.forEach(function (f, i) {
                f = '/public/js/components/sals_' + f + '.js';
                links.push(f);
            });
        }
        if (typeof files == 'string') {
            files = '/public/js/components/sals_' + files + '.js';
            links.push(files);
        }

        sals.Loader.js(links, function () {
            if (typeof callback == 'function') {
                callback();
            }
        });
    };
    /**
     * 动态加载
     */
    _self.Loader = (function (doc) {
        var env,
            head,
            pending = {},
            pollCount = 0,
            queue = { css: [], js: [] },
            styleSheets = doc.styleSheets;
        function createNode(name, attrs) {
            var node = doc.createElement(name), attr;
            for (attr in attrs) {
                if (attrs.hasOwnProperty(attr)) {
                    node.setAttribute(attr, attrs[attr]);
                }
            }
            return node;
        }
        function finish(type) {
            var p = pending[type],
                callback,
                urls;

            if (p) {
                callback = p.callback;
                urls = p.urls;

                urls.shift();
                pollCount = 0;
                if (!urls.length) {
                    callback && callback.call(p.context, p.obj);
                    pending[type] = null;
                    queue[type].length && load(type);
                }
            }
        }
        function getEnv() {
            var ua = navigator.userAgent;

            env = {
                async: doc.createElement('script').async === true
            };

            (env.webkit = /AppleWebKit\//.test(ua))
                || (env.ie = /MSIE|Trident/.test(ua))
                || (env.opera = /Opera/.test(ua))
                || (env.gecko = /Gecko\//.test(ua))
                || (env.unknown = true);
        }
        function load(type, urls, callback, obj, context) {
            var _finish = function () {
                finish(type);
            },
                isCSS = type === 'css',
                nodes = [],
                i, len, node, p, pendingUrls, url;

            env || getEnv();

            if (urls) {
                urls = typeof urls === 'string' ? [urls] : urls.concat();
                if (isCSS || env.async || env.gecko || env.opera) {
                    queue[type].push({
                        urls: urls,
                        callback: callback,
                        obj: obj,
                        context: context
                    });
                } else {
                    for (i = 0, len = urls.length; i < len; ++i) {
                        queue[type].push({
                            urls: [urls[i]],
                            callback: i === len - 1 ? callback : null,
                            obj: obj,
                            context: context
                        });
                    }
                }
            }
            if (pending[type] || !(p = pending[type] = queue[type].shift())) {
                console.log('空引用')
                return;
            }

            head || (head = doc.head || doc.getElementsByTagName('head')[0]);
            pendingUrls = p.urls.concat();

            for (i = 0, len = pendingUrls.length; i < len; ++i) {
                url = pendingUrls[i];

                if (isCSS) {
                    node = env.gecko ? createNode('style') : createNode('link', {
                        href: url,
                        rel: 'stylesheet'
                    });
                } else {
                    node = createNode('script', { src: url });
                    node.async = false;
                }

                node.className = 'lazy-load';
                node.setAttribute('charset', 'utf-8');

                if (env.ie && !isCSS && 'onreadystatechange' in node && !('draggable' in node)) {
                    node.onreadystatechange = function () {
                        if (/loaded|complete/.test(node.readyState)) {
                            node.onreadystatechange = null;
                            _finish();
                        }
                    };
                } else if (isCSS && (env.gecko || env.webkit)) {

                    if (env.webkit) {
                        p.urls[i] = node.href;
                        pollWebKit();
                    } else {
                        node.innerHTML = '@import "' + url + '";';
                        pollGecko(node);
                    }
                } else {
                    node.onload = node.onerror = _finish;
                }

                nodes.push(node);
            }

            for (i = 0, len = nodes.length; i < len; ++i) {
                head.appendChild(nodes[i]);
            }
        }
        function pollGecko(node) {
            var hasRules;
            try {
                hasRules = !!node.sheet.cssRules;
            } catch (ex) {
                pollCount += 1;

                if (pollCount < 200) {
                    setTimeout(function () { pollGecko(node); }, 50);
                } else {
                    hasRules && finish('css');
                }

                return;
            }
            finish('css');
        }
        function pollWebKit() {
            var css = pending.css, i;

            if (css) {
                i = styleSheets.length;
                while (--i >= 0) {
                    if (styleSheets[i].href === css.urls[0]) {
                        finish('css');
                        break;
                    }
                }

                pollCount += 1;

                if (css) {
                    if (pollCount < 200) {
                        setTimeout(pollWebKit, 50);
                    } else {
                        finish('css');
                    }
                }
            }
        }

        return {

            css: function (urls, callback, obj, context) {
                load('css', urls, callback, obj, context);
            },
            js: function (urls, callback, obj, context) {
                load('js', urls, callback, obj, context);
            }

        };
    })(window.document);

})
$.ajaxSetup({
    url: '',
    type: 'POST',
    dataType: 'json',
    error: function (err) {
        console.info(err);
        sals.tip(err)
    },
    beforeSend: function (ajax, req) {
        ajax.setRequestHeader("sys", "sals-net-chianmain");
    }
})

Sals.prototype.money = function (price) {
    price = parseFloat(price).toFixed(2)
    return '¥' + String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

Sals.prototype.date = function (date, fmt) {
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
/**
 * 获取URL参数
 * @param {string} variable 参数名
 * @returns 参数值
 */
Sals.prototype.getQuery = function (variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return pair[1]; }
    }
    return (false);
}
/**
 * 建议AJAX提交 [POST 数据]
 * @param {string} url 提交地址
 * @param {object} data 提交的数据
 * @param {function} callback 回调函数
 */
Sals.prototype.post = function (url, data, callback) {
    data._r = Math.random()
    $.ajax({
        url: url,
        data: data,
        success: function (res) {
            callback(res);
        }
    })
}
/**
 * 每间隔多少毫秒 执行回调
 * @param {number} tick 每间隔多少毫秒执行一次回调
 * @param {function} callback 
 */
Sals.prototype.Countdown = function (tick, callback) {

}
    ;;;;
var sals = new Sals();
window.onload = function () {
    sals.init();
}