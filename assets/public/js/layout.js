var Layout = (function () {
    
    function Layout() {
        this.Animations = {
            tada: 'tada',
            bounce: 'bounce',
            glow: 'glow',
            pulse: 'pulse',
            shake: 'shake',

            flash: 'flash',
            jiggle: 'jiggle',
            zoom: 'zoom',
            scale: 'scale',
            drop: 'drop',

            fade_left: 'fade left',
            fade_right: 'fade right',
            fade_down: 'fade down',
            fade_up: 'fade up',
            fade: 'fade',

            vertical_flip: 'vertical flip',
            horizontal_flip: 'horizontal flip',

            fly_left: 'fly left',
            fly_right: 'fly right',
            fly_down: 'fly down',
            fly_up: 'fly up',

            swing_left: 'swing left',
            swing_right: 'swing right',
            swing_down: 'swing down',
            swing_up: 'swing up',

            slide_left: 'slide left',
            slide_right: 'slide right',
            slide_down: 'slide down',
            slide_up: 'slide up',

            browse: 'browse',
            browse_right: 'browse right'
        }
        this.SETTINGS = {}
    }
    Layout.prototype.init = function (settings) {
        this.SETTINGS = settings;
        /* 获取服务器时间  START*/
        try{
            $.post('/cgi-bin/time-stamp',function(res){
                if(res.timestamp){
                    let tsp = res.timestamp;
                    setInterval(function(){
                        let nTime = new Date(tsp);
                        $('label.mor_text').text(nTime.getFullYear()+'-'+(nTime.getMonth()+1)+'-'+nTime.getDate()+' '+nTime.getHours()+':'+nTime.getMinutes()+':'+nTime.getSeconds() );
                        tsp=tsp+1000;
                    }, 1000);
                }
            });
        }catch(e){ }
        /* 获取服务器时间  END*/



        /** 
         * 左侧菜单
         */
        $('.sidebar-menu').on('click', 'li a', function (e) {
            var animationSpeed = 300;
            var $this = $(this);
            /**
             * 点击菜单 设置标签页
             */
            var url = $this.data('href');
            if (url != '' && url != 'javascript:;' && url != undefined && url != 'undefined') {
                var canClose = true;
                if ($this.data('close') == 'false') {
                    canClose = false
                }
                layout.TabPage.AddPage($this.data('title'), url, 'icon ' + $this.data('icon'), canClose);
            }
            /*****   标签页结束             ****************************************************************************/
            var checkElement = $this.next();
            if (checkElement.is('.treeview-menu') && checkElement.is(':visible')) {
                checkElement.slideUp(animationSpeed, function () {
                    checkElement.removeClass('menu-open');
                });
                checkElement.parent("li").removeClass("active");
            }
            else if ((checkElement.is('.treeview-menu')) && (!checkElement.is(':visible'))) {
                var parent = $this.parents('ul').first();
                var ul = parent.find('ul:visible').slideUp(animationSpeed);
                ul.removeClass('menu-open');
                var parent_li = $this.parent("li");
                checkElement.slideDown(animationSpeed, function () {
                    checkElement.addClass('menu-open');
                    parent.find('li.active').removeClass('active');
                    parent_li.addClass('active');
                });
            }
            if (checkElement.is('.treeview-menu')) {
                e.preventDefault();
            }
        });
        /**
         * 折叠菜单
         */
        $('.switch-sidebar').on('click', function () {
            $('.layout-root').toggleClass('screen-max');
        })
        $('.ui.dropdown').dropdown({ action: 'hide' });
        $('.dropdown-portrait').dropdown({
            displayType: 'block',
            action: 'hide'
        })

        $('.popup-tool').popup({ variation: 'mini' });

        /** 个人信息 */
        $('.profile-setting').on('click', function (e) {
            layout.TabPage.AddPage($(this).data('title'), $(this).data('url'), $(this).data('icon'));
        });
        $('.clear-cache').on('click', function (e) {
            $.ajax({
                url: window.location.href + (window.location.href.endsWith('/') ? 'clear-cache' : '/clear-cache'),
                success: function (res) {
                    if (res.success) {
                        layout.tip(res.message);
                    } else {
                        layout.notify(res.message, 'error');
                    }
                }
            })
        });
        /** 全屏 */
        $('.ctrl-full-screen').on('click', function () {
            if ($(this).children('i').hasClass('expand')) {
                layout.Fullscreen(true);
                $(this).children('i').attr({ 'class': 'icon compress arrows alternate' })
            } else {
                layout.Fullscreen(!1);
                $(this).children('i').attr({ 'class': 'icon expand arrows alternate' })
            }
            $(window).on('resize', function () {
                var isFull = !!(document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement);
                if (isFull == false) {
                    $('.ctrl-full-screen').children('i').attr({ 'class': 'icon expand arrows alternate' })
                } else {
                    $('.ctrl-full-screen').children('i').attr({ 'class': 'icon compress arrows alternate' })
                }
            })
        })
        /** 刷新 */
        $('.ctrl-refresh').on('mouseover mouseout click', function (event) {
            var $this = $('.ctrl-refresh');
            if (event.type == "mouseover") {
                $this.children('i').addClass('loading')
            } else if (event.type == "mouseout") {
                $this.children('i').removeClass('loading');
            }
            else if (event.type == "click") {
                progress.start()
                let $frame = $('.content-body div.body-item:visible').children('iframe');
                let src = $frame.attr('src');
                $frame.attr({ src: src });
            }
        })
        /**
         * 问题反馈
         */
        $('.ctrl-feedback').on('click', function () {
            $('.modal-feedback').modal({
                blurring: false,
                inverted: false,
                autofocus: true,
                transition: layout.Animations.fade,// fade 
                onApprove: function () {
                    $.ajax({
                        type: "POST",
                        url: window.location.href + '/feedback',
                        data: { feedback: $('#layout-modal-feedback-textarea').val(), _r: Math.random() },
                        success: function (res) {
                            if (res.success) {
                                $('.modal-feedback').modal('hide');
                                $('#layout-modal-feedback-textarea').val('');
                                setTimeout(function () {
                                    layout.alert(res.message);
                                }, 220);
                            } else {
                                layout.notify(res.message, { class: 'error' });
                            }
                        }
                    })
                    return false;
                }
            }).modal('show');
            layout.Drag($('.modal-feedback').children('div.header'), $('.modal-feedback'));
        })

        /**
         * 主题 皮肤 颜色 设置
         */
        $('.theme-setting').on('click', function () {
            $('.theme-sidebar')
                .sidebar({
                    scrollLock: true,
                    dimPage: !1,
                    closable: 1,
                    transition: 'overlay',
                    onChange: function () {
                        $('.pusher .layout-root').css({ 'height': $(document.body).height() })
                        $(window).on('resize', function () {
                            $('.pusher .layout-root').css({ 'height': $(document.body).height() })
                        })
                    }
                }).sidebar('show');
        });
        var greet = window.localStorage.getItem('greet-sidebar');
        if (!greet || (Date.now() - greet) > 144e5) {
            $('.sidebar-top-information').sidebar({
                closable: false,
                transition: 'overlay',
                scrollLock: true,
                dimPage: false,
                onShow: function () {
                    window.localStorage.setItem('greet-sidebar', Date.now());
                    setTimeout(function () {
                        $('.sidebar-top-information').sidebar('hide')
                    }, 3e3);
                }
            }).sidebar('show');
        }
        /**
         * 长时间未操作
         */
        $(window.document.body).on('keydown click mousemove', function () {
            if (layout.LockOperation && !layout.isLockLayout) {
                layout.LockOperation = !layout.LockOperation;
                window.localStorage.setItem('last-use', Date.now());
            }
        });
        function isLeave() {
            if (!layout.isLockLayout) {
                var last_time = window.localStorage.getItem('last-use');
                if (last_time) {
                    var now_time = Date.now();
                    if (now_time - last_time > 1.8e6) {
                        layout.LockLayout();
                        layout.isLockLayout = true;
                    }
                }
            }
            setTimeout(function () {
                if (!layout.LockOperation) {
                    layout.LockOperation = true;
                }
                isLeave();
            }, 1e4);
        };
        window.localStorage.setItem('last-use', Date.now());
        setTimeout(function () {
            isLeave();
        }, 600);
        $('.theme-setting-close').on('click', function () { $('.theme-sidebar').sidebar('hide') });

       
        /**
         * 搜索菜单
         */
        $('.layout-search').search({
            apiSettings: {
                url: window.location.href.split('?')[0] + '/search/{query}'
            },
            fields: {
                results: 'items',
                title: 'title',
                url: '-none-'
            },
            maxResults: 3,
            minCharacters: 2,
            onSelect: function (result, response) {
                $('.layout-search .results').removeClass('visible').hide();
                if (result && result.options && result.options.url) {
                    layout.TabPage.AddPage(result.options.title, result.options.url, result.options.icon);
                }
            }
        })

        /**
         * 修改密码
         */
        $('.password-setting').on('click', function (e) {
            $('.setting-password').modal({
                blurring: false,
                inverted: false,
                autofocus: true,
                transition: layout.Animations.browse,// fade
                onHidden: function () {
                    $('.setting-password input[name="password-old"]').val('');
                    $('.setting-password input[name="password-new1"]').val('');
                    $('.setting-password input[name="password-new2"]').val('');
                },
                onApprove: function () {
                    var pwd_1 = $('.setting-password input[name="password-old"]').val();
                    var pwd_2 = $('.setting-password input[name="password-new1"]').val();
                    var pwd_3 = $('.setting-password input[name="password-new2"]').val();
                    $.ajax({
                        type: "POST",
                        url: window.location.href + '/password-alter',
                        data: { p: pwd_1, n1: pwd_2, n2: pwd_3, _r: Math.random() },
                        success: function (res) {
                            if (res.success) {
                                layout.alert(res.message, function () {
                                    top.location.replace(res.url);
                                })
                            } else {
                                layout.notify(res.message, { class: 'error' });
                            }
                        }
                    })
                    return false;
                }
            }).modal('show');
            layout.Drag($('.setting-password').children('div.header'), $('.setting-password'));
        });
        /* 退出 */
        $('.login-out-ctrl').on('click', function () {
            var $this = $(this);
            layout.confirm($this.data('confirm'), function (res) { if (res) { window.location.replace($this.data('login-out-url')) } });
        })
        layout.TabPage.OnContextmenu = function (dom) {
            layout.Contextmenu({
                dom: dom,
                items: {
                    "refresh": { name: $('div.tabs-refresh').text(), icon: "icon refresh", hr: true },
                    "close": { name: $('div.tabs-close').text(), icon: "icon remove" },
                    "close_all": { name: $('div.tabs-close-all').text(), icon: "icon clone" },
                    "close_other": { name: $('div.tabs-close-other').text(), icon: "icon filter", disable: !true, hr: true },
                    "close_left": { name: $('div.tabs-close-left').text(), icon: "icon toggle left" },
                    "close_right": { name: $('div.tabs-close-right').text(), icon: "icon toggle right" }
                },
                callback: function (res) {
                    var url = $(dom).attr("data-id");
                    switch (res.data) {
                        case "refresh":
                            layout.TabPage.Refresh(url);
                            break;
                        case "close":
                            layout.TabPage.Close(url);
                            break;
                        case "close_all":
                            layout.TabPage.CloseAll(url);
                            break;
                        case "close_other":
                            layout.TabPage.CloseOther(url);
                            break;
                        case "close_left":
                            layout.TabPage.CloseLeft(url);
                            break;
                        case "close_right":
                            layout.TabPage.CloseRight(url);
                            break;
                        default:
                            break;
                    }
                }
            })
        }
        $('div.tabs-refresh').on('click', function () {
            $('.tabs-dropdown').dropdown('hide');
            layout.TabPage.Refresh();
        });
        $('div.tabs-position').on('click', function () {
            $('.tabs-dropdown').dropdown('hide');
            layout.TabPage.Active();
        });
        $('div.tabs-close').on('click', function () {
            $('.tabs-dropdown').dropdown('hide');
            layout.TabPage.Close();
        });
        $('div.tabs-close-all').on('click', function () {
            $('.tabs-dropdown').dropdown('hide');
            layout.TabPage.CloseAll();
        });
        $('div.tabs-close-other').on('click', function () {
            $('.tabs-dropdown').dropdown('hide');
            layout.TabPage.CloseOther();
        });
        $('div.tabs-close-left').on('click', function () {
            $('.tabs-dropdown').dropdown('hide');
            layout.TabPage.CloseLeft();
        });
        $('div.tabs-close-right').on('click', function () {
            $('.tabs-dropdown').dropdown('hide');
            layout.TabPage.CloseRight();
        });

        $(".content-tabs button.scroll-left").on('click', function () {
            $('.tabs-dropdown').dropdown('hide');
            layout.TabPage.ScrollLeft();
        });
        $(".content-tabs button.scroll-right").on('click', function () {
            $('.tabs-dropdown').dropdown('hide');
            layout.TabPage.ScrollRight();
        });
        /* 进度条 */
        var progress = new layout.ProgressBar({ color: "#a333c8", parent: "body", showSpinner: false });
        layout.TabPage.OnLoad = function () { progress.start() };
        layout.TabPage.OnLoadSuccess = function (frame) {
            $(frame).contents().on('keydown mousedown mousewheel', function () {
                $(window.document.body).trigger('click');
            })
            progress.done();
        }
        /* 离开时间过长 */
        $('.button-lock-layout').on('click', function () {
            layout.LockLayout();
        })
    }
    /**
     * flyout
     */
    Layout.prototype.flyout = function (options) {
        if (this.flyoutIndex > 0) {
            this.flyoutIndex = this.flyoutIndex + 1;
        } else {
            this.flyoutIndex = 1;
        }
        var $div = $('<div></div>').appendTo(document.body).attr({ id: 'div-flyout-' + this.flyoutIndex });
        $div.flyout({
            debug: false,
            blurring: true,
            scrollLock: true,
            returnScroll: true,
            preserveHTML: false,
            verbose: true,
            autoShow: true,

            title: (options.title || ''),
            class: options.class || 'wide right',
            content: options.content || '',
            actions: options.actions || false,

            onHidden: function () {
                $div.remove();
            },
            closeIcon: true,

        });
    }
    
    /**
     * 
     * @param {*} options 
     */
    Layout.prototype.toast = function (options) {
        var opt = {
            position: 'bottom right',
            context:top.$('.content-body'),
            displayTime: 0,
            closeIcon: true,
            opacity: 1,
            closeOnClick: false,

            classActions: 'attached',
            class: 'centered',
            position: 'top attached',
            actions: [{
                text: 'Mark as read',
                class: 'grey'
            }, {
                text: 'Delete',
                class: 'red'
            }],
            onShow: function () {
                //$(this).find('.toast').css({ padding: '0' });
            },
            onClick: function ($module) {
                return false;
            }
        }
        var opt = $.extend(opt, options);
        $('body').toast(opt);
    }
    /**
     * 弹出层
     */
    Layout.prototype.modal = function (content, options) {
        var opt = $.extend({
            classList: 'mini',
            closable: false,
            header: layout.SETTINGS.modal_title,
            fun: function () { },
            autofocus: true,
            allowMultiple: true,
            transition: this.Animations.browse,// fade
            actions: [],
            centered: true,
            onDeny: function () {
                opt.fun(false)
            },
            onApprove: function () {
                opt.fun(true)
            }
        }, options)

        let $modal = $('<div class="ui modal ' + opt.classList + '"></div>').appendTo(document.body);
        if (opt.closable) {
            $modal.append('<i class="close icon"></i>');
        }
        $modal.append('<div class="header">' + opt.header + '</div>');
        var $content = $('<div class="scrolling content"></div>');
        $modal.append($content);//'<div class="scrolling content">' + content + '</div>');
        $modal.append(opt.actions);
        opt = $.extend({
            onHidden: function () {
                $modal.remove();
            }
        }, opt)
        $modal.modal(opt).modal('show');
        $content.append(content)
        layout.Drag($modal.children('div.header'), $modal)
        return $modal
    }
    Layout.prototype.notify = function (content, style) {
        $('body').toast({
            title: style && style.title,
            class: style && style.class,/* 'success' 'error' 'warning' */
            message: content,
            position: 'top right',/* position: 'top attached', 'bottom attached', */
            classProgress: 'teal',
            showProgress: 'bottom',
            displayTime: 'auto',
            minDisplayTime: 1000 * 5,
            wordsPerMinute: 20,
            progressUp: false,
            className: {
                toast: 'ui message'
            }
        });
    }
    Layout.prototype.tip = function (content) {
        $('body').toast({
            message: content,
            position: 'top center',
            classProgress: 'yellow',
            showProgress: 'top',
            displayTime: 5 * 1000,
            progressUp: false,
        });
    }
    Layout.prototype.alert = function (content, callback) {
        this.modal(content, {
            actions: $('#modal-actions-alert').html(),
            fun: callback
        })
    }
    Layout.prototype.prompt = function (content, callback, defValue) {
        defValue = defValue || '';
        let uid = 'ui-prompt-' + new Date().getTime();
        let div = `
        <div class="ui fluid input">
            <input type="text" id="${uid}" placeholder="请输入内容..." value="${defValue}" autofocus autocomplete="off"/>
        </div>
        `;
        this.modal(div, {
            header: content,
            actions: $('#modal-actions-confirm').html(),
            onApprove: function () {
                callback($('#' + uid).val())
            }
        })

    }
    Layout.prototype.confirm = function (content, callback) {
        this.modal(content, {
            actions: $('#modal-actions-confirm').html(),
            fun: callback
        })
    }
    /**
     * 拖拽
     */
    Layout.prototype.Drag = function (ele, dom) {
        $(ele).on('mouseover', function (e) {
            e.preventDefault();
            $(ele).css({ "cursor": "move" });
        }).on('mousedown', function (e) {
            e.preventDefault();
            var box = $(dom);
            var positionDiv = box.offset();
            var distenceX = e.pageX - positionDiv.left;
            var distenceY = e.pageY - positionDiv.top;
            $(document).on('mousemove', function (e) {
                var x = e.pageX - distenceX;
                var y = e.pageY - distenceY;
                if (x < 0) {
                    x = 0
                } else {
                    if (x > $(window).width() - $(box).width() - (0)) {
                        x = $(window).width() - $(box).width() - (0)
                    }
                }
                if (y < 0) {
                    y = 0
                }
                else {
                    if (y > $(document).height() - $(box).outerHeight(true)) {
                        y = $(document).height() - $(box).outerHeight(true)
                    }
                }
                $(box).css({ "left": x + "px", "top": y + "px" })
            });
            $(document).on('mouseup', function () {
                $(document).off("mousemove")
            })
        })
    }
    /**
     * 右键菜单
     * @param {object} options 参数
     */
    Layout.prototype.Contextmenu = function (options) {
        options = $.extend({ dom: document.body, items: {}, callback: function () { } }, options);
        function create(items, key) {
            var html = "";
            var key = key ? key : "main";
            if (key == 'main') {
                html += '<div class="ui floating dropdown mini contextmenu-dropdown" ><div style="position:fixed;z-index:2001" class="ui menu contextmenu-' + key + '" >';
            }
            $.each(items, function (key, val) {
                if (val.hidden) {
                    return;
                }
                var icon = val.icon ? '<i class="' + val.icon + ' "></i>' : "";
                html += '<div class="item ' + (val.disable ? "disabled" : "") + ' " data-content="' + key + '">' + icon
                if (val.hasOwnProperty("items")) {
                    html += '<i class="dropdown icon"></i>';
                    html += '<span class="text">' + val.name + '</span>';

                    html += '<div class="menu right floating hidden" style="display:none" >';
                    html += create(val.items, "child");
                    html += '</div>';

                } else {
                    html += val.name;
                }
                html += '</div>';
                if (val.hr === true) {
                    html += '<div class="divider"></div>';
                }
            })
            if (key == 'main') {
                html += "</div></div>";
            }
            return html;
        }

        function remove() {
            $(".contextmenu.noselect").remove();
        }

        $(options.dom).on('mousedown', function (e) {
            var $this = this;
            if (e.button === 2 && !$(this).hasClass('no-contextmenu')) {
                e.stopPropagation();
                e.preventDefault();
                remove();
                var menus = create(options.items);
                var html = '<div class="contextmenu noselect" style="height:0px !important">' + menus + "</div>";
                $(document.body).append(html);
                $('.contextmenu-dropdown').dropdown({ action: 'hide' })
                $(".contextmenu-main").css({ "top": e.pageY + "px", "left": e.pageX + "px" }).transition(layout.Animations.fade).on("contextmenu", function (x) {
                    x.stopPropagation();
                    x.preventDefault();
                    return false
                });
                $(document.body).on("contextmenu click", function (f) {
                    if ($('.contextmenu.noselect').length > 0) {
                        f.stopPropagation();
                        f.preventDefault();
                        remove();
                        $(document.body).off('contextmenu');
                        $(document.body).off('click');
                    }
                }).one('keyup', function (x) { x.stopPropagation(); x.preventDefault(); if (x.key == 'Escape') { remove() } });
                $("div.item").on("click", function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if ($(this).hasClass("disabled")) { return false }
                    var content = $(this).data("content");
                    options.callback({ event: "click", data: content, dom: this, element: $this });
                    remove();
                    return false
                })
            } else { remove() }
        }).on("contextmenu", function (c) {
            c.stopPropagation();
            c.preventDefault();
            return false;
        })

    }
    /**
     * 开启/关闭 全屏展示
     * @param {boolean} full 是否全屏
     */
    Layout.prototype.Fullscreen = function (full) {
        if (full) {
            var element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            }

        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }

    }
    /**
     * 标签页
     */
    Layout.prototype.TabPage = {
        _calSumWidth: function (elements) {
            var width = 0;
            $(elements).each(function () { width += $(this).outerWidth(true) });
            return width
        },
        OnLoad: function () { },
        OnLoadSuccess: function () { },
        OnContextmenu: function (dom) { },
        AddPage: function (title, url, icon, close) {
            if (close !== false) { close = true }
            var _this = this;
            var actived = false;
            $(".page-tabs-content a.tab").each(function (i, d) {
                if ($(d).attr("data-id") == url) {
                    actived = true;
                    _this.ShowContent(url, false);
                    return false
                }
            });
            if (!actived) {
                var $tabTitle = $("<a></a>").attr({ "href": "javascript:;", "class": "tab", "data-id": url, "closable": close });
                if (icon != void 0) { $tabTitle.append('<i class="' + icon + ' "></i>&nbsp;') }
                $tabTitle.append(title);
                if (close == true) {
                    $tabTitle.append('&nbsp;<i class="icon close"></i>');
                    $tabTitle.children('i.close').on('click', function () {
                        _this.Close(url);
                    })
                }
                $(".page-tabs-content").append($tabTitle);
                _this.ShowContent(url, false);
                $tabTitle.on('click', function () { _this.ShowContent(url, false) });
                $tabTitle.children("i.fa-times-circle").on('click', function () { _this.Close(url) });
                _this.OnContextmenu($tabTitle)
            }
        },
        Close: function (url) {
            if (url == void 0) { url = $(".page-tabs-content a.active").attr("data-id") }
            $tabTitle = $('.page-tabs-content a[data-id="' + url + '"]');
            if ($tabTitle.attr("closable") == "false") { return }
            var did = $tabTitle.attr("data-id");
            if ($tabTitle.hasClass("active")) {
                if ($tabTitle.next("a.tab").length) {
                    var activeId = $tabTitle.next("a.tab:eq(0)").attr("data-id");
                    $(".page-tabs-content a.tab").removeClass("active");
                    $(".page-tabs-content a[data-id='" + activeId + "']").addClass("active");
                    $(".content-body div.body-item").hide();
                    $('.content-body div[data-id="' + activeId + '"]').show();
                    $(".page-tabs-content a[data-id='" + did + "']").remove();
                    $(".content-body div[data-id='" + did + "']").remove();
                    this.Active();
                    return false
                } else {
                    if ($tabTitle.prev("a").length) {
                        var activeId = $tabTitle.prev("a:last").addClass("active").attr("data-id");
                        $(".content-body div.body-item").hide();
                        $('.content-body div[data-id="' + activeId + '"]').show();
                        $(".page-tabs-content a[data-id='" + did + "']").remove();
                        $(".content-body div[data-id='" + did + "']").remove();
                        this.Active()
                    } else {
                        $(".page-tabs-content a[data-id='" + did + "']").remove();
                        $(".content-body div[data-id='" + did + "']").remove();
                        this.Active();
                        return false
                    }
                }
            } else {
                $(".page-tabs-content a[data-id='" + did + "']").remove();
                $(".content-body div[data-id='" + did + "']").remove()
            }
        },
        CloseAll: function () {
            $(".page-tabs-content a.tab").each(function (i, dom) {
                if ($(dom).attr("closable") == "true") {
                    var did = $(dom).attr("data-id");
                    $(dom).remove();
                    $('.content-body div[data-id="' + did + '"]').remove()
                }
            });
            if ($(".page-tabs-content a.active").length > 0) { this.Active(); return false }
            var adid = $(".page-tabs-content a.tab:eq(0)").addClass("active").attr("data-id");
            $('.content-body div[data-id="' + adid + '"]').show();
            this.Active()
        },
        CloseLeft: function (url) {
            if (url == void 0) { url = $(".page-tabs-content a.active").attr("data-id") }
            $($(".page-tabs-content a[data-id='" + url + "']")).prevAll("a").each(function (i, d) {
                if ($(d).attr("closable") == "true") {
                    $(d).remove();
                    $(".content-body div[data-id='" + $(d).attr("data-id") + "']").remove()
                }
            });
            if ($(".page-tabs-content a.active").length > 0) { this.Active(); return false }
            var adid = $(".page-tabs-content a[data-id='" + url + "']").addClass("active").attr("data-id");
            $('.content-body div[data-id="' + adid + '"]').show();
            this.Active()
        },
        CloseRight: function (url) {
            if (url == void 0) { url = $(".page-tabs-content a.active").attr("data-id") }
            $($(".page-tabs-content a[data-id='" + url + "']")).nextAll("a").each(function (i, d) {
                if ($(d).attr("closable") == "true") {
                    $(d).remove();
                    $(".content-body div[data-id='" + $(d).attr("data-id") + "']").remove()
                }
            });
            if ($(".page-tabs-content a.active").length > 0) { this.Active(); return false }
            var adid = $(".page-tabs-content a[data-id='" + url + "']").addClass("active").attr("data-id");
            $('.content-body div[data-id="' + adid + '"]').show();
            this.Active()
        },
        CloseOther: function (url) {
            if (url == void 0) { url = $(".page-tabs-content a.active").attr("data-id") }
            var isActived = $(".page-tabs-content a[data-id='" + url + "']").hasClass("active");
            $(".page-tabs-content a").each(function (i, d) {
                var remId = $(d).attr("data-id");
                if (remId != url && $(d).attr("closable") == "true") {
                    $(".page-tabs-content a[data-id='" + remId + "']").remove();
                    $(".content-body div[data-id='" + remId + "']").remove()
                }
            });
            if ($(".page-tabs-content a.active").length > 0) { this.Active(); return false }
            if (!isActived) {
                var did = $(".page-tabs-content a[data-id='" + url + "']").addClass("active").attr("data-id");
                $('.content-body div[data-id="' + did + '"]').show();
                this.Active()
            }
        },
        Active: function (url) {
            var element = $(".page-tabs-content a.active");
            var marginLeftVal = this._calSumWidth($(element).prevAll()),
                marginRightVal = this._calSumWidth($(element).nextAll());
            var tabOuterWidth = this._calSumWidth($(".content-tabs").children().not(".page-tabs"));
            var visibleWidth = $(".content-tabs").outerWidth(true) - tabOuterWidth;
            var scrollVal = 0;
            if ($(".page-tabs-content").outerWidth() < visibleWidth) { scrollVal = 0 } else {
                if (marginRightVal <= (visibleWidth - $(element).outerWidth(true) - $(element).next().outerWidth(true))) {
                    if ((visibleWidth - $(element).next().outerWidth(true)) > marginRightVal) {
                        scrollVal = marginLeftVal;
                        var tabElement = element;
                        while ((scrollVal - $(tabElement).outerWidth()) > ($(".page-tabs-content").outerWidth() - visibleWidth)) {
                            scrollVal -= $(tabElement).prev().outerWidth();
                            tabElement = $(tabElement).prev()
                        }
                    }
                } else { if (marginLeftVal > (visibleWidth - $(element).outerWidth(true) - $(element).prev().outerWidth(true))) { scrollVal = marginLeftVal - $(element).prev().outerWidth(true) } }
            }
            $(".page-tabs-content").animate({ marginLeft: 0 - scrollVal + "px" }, "fast")
        },
        ScrollLeft: function (url) {
            if (url == void 0) { url = $(".page-tabs-content a.active").attr("data-id") }
            var marginLeftVal = Math.abs(parseInt($(".page-tabs-content").css("margin-left")));
            var tabOuterWidth = this._calSumWidth($(".content-tabs").children().not(".page-tabs"));
            var visibleWidth = $(".content-tabs").outerWidth(true) - tabOuterWidth;
            var scrollVal = 0;
            if ($(".page-tabs-content").width() < visibleWidth) { return false } else {
                var tabElement = $(".page-tabs a.tab:first");
                var offsetVal = 0;
                while ((offsetVal + $(tabElement).outerWidth(true)) <= marginLeftVal) {
                    offsetVal += $(tabElement).outerWidth(true);
                    tabElement = $(tabElement).next()
                }
                offsetVal = 0;
                if (this._calSumWidth($(tabElement).prevAll()) > visibleWidth) {
                    while ((offsetVal + $(tabElement).outerWidth(true)) < (visibleWidth) && tabElement.length > 0) {
                        offsetVal += $(tabElement).outerWidth(true);
                        tabElement = $(tabElement).prev()
                    }
                    scrollVal = this._calSumWidth($(tabElement).prevAll())
                }
            }
            $(".page-tabs-content").animate({ marginLeft: 0 - scrollVal + "px" }, "fast")
        },
        ScrollRight: function (url) {
            if (url == void 0) { url = $(".page-tabs-content a.active").attr("data-id") }
            var marginLeftVal = Math.abs(parseInt($(".page-tabs-content").css("margin-left")));
            var tabOuterWidth = this._calSumWidth($(".content-tabs").children().not(".page-tabs"));
            var visibleWidth = $(".content-tabs").outerWidth(true) - tabOuterWidth;
            var scrollVal = 0;
            if ($(".page-tabs-content").width() < visibleWidth) { return false } else {
                var tabElement = $(".page-tabs a.tab:first");
                var offsetVal = 0;
                while ((offsetVal + $(tabElement).outerWidth(true)) <= marginLeftVal) {
                    offsetVal += $(tabElement).outerWidth(true);
                    tabElement = $(tabElement).next()
                }
                offsetVal = 0;
                while ((offsetVal + $(tabElement).outerWidth(true)) < (visibleWidth) && tabElement.length > 0) {
                    offsetVal += $(tabElement).outerWidth(true);
                    tabElement = $(tabElement).next()
                }
                scrollVal = this._calSumWidth($(tabElement).prevAll());
                if (scrollVal < 0) { scrollVal = 0 }
                if (scrollVal > 0) { $(".page-tabs-content").animate({ marginLeft: 0 - scrollVal + "px" }, "fast") }
            }
        },
        ShowContent: function (url, refresh) {
            if (url == "" || url == undefined || url.length < 5) { return }
            var $nav = $(".page-tabs-content").find("a.tab");
            if ($nav.size() > 0) {
                $(".page-tabs-content").find("a").removeClass("active");
                $(".page-tabs-content a[data-id='" + url + "']").addClass("active")
            }
            var self = this;
            var actived = false;
            $(".content-body div").each(function (x, cont) {
                if ($(cont).attr("data-id") == url) {
                    $(".content-body div.body-item").hide().removeClass('active');
                    $(cont).show().addClass("active");
                    $(".page-tabs-content a.tab").removeClass("active");
                    $(".page-tabs-content a[data-id='" + url + "']").addClass("active");
                    actived = true;
                    return false
                }
            });
            if (refresh) {
                $('.content-body div[data-id="' + url + '"]').remove();
                actived = false
            }
            if (actived) { this.Active(); return }
            this.OnLoad();
            $(".page-tabs-content a.tab").removeClass("active");
            $(".page-tabs-content a[data-id='" + url + "']").addClass("active");
            var $content = $("<div></div>").attr({ "style": "width: 100%;height: 100%;", "data-id": url }).attr({ "class": "body-item" });
            var $frame = $("<iframe></iframe>").attr({ "src": url, "frameborder": "0", "scrolling": "auto" }).css({ "width": "100%", "height": " 100%" });
            $frame.load(function (d) { self.OnLoadSuccess($frame) });
            $content.append($frame);
            $(".content-body div.body-item").hide();
            $(".content-body").append($content);
            self.Active()
        },
        Refresh: function (url) {
            this.ShowContent(url, true);
        }
    }
    /**
     * 进度条
     */
    Layout.prototype.ProgressBar = function (options) {
        var bar = {};
        bar.Settings = { color: "#29d", minimum: 0.08, easing: "ease", positionUsing: "", speed: 200, trickle: true, trickleRate: 0.02, trickleSpeed: 800, showSpinner: true, barSelector: '[role="bar"]', spinnerSelector: '[role="spinner"]', parent: "body", template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>' };
        var key, value;
        for (key in options) { value = options[key]; if (value !== undefined && options.hasOwnProperty(key)) { bar.Settings[key] = value } }
        bar.status = null;
        bar.set = function (n) {
            var started = bar.isStarted();
            n = clamp(n, bar.Settings.minimum, 1);
            bar.status = (n === 1 ? null : n);
            var progress = bar.render(!started),
                barSelect = progress.querySelector(bar.Settings.barSelector),
                speed = bar.Settings.speed,
                ease = bar.Settings.easing;
            progress.offsetWidth;
            queue(function (next) {
                if (bar.Settings.positionUsing === "") { bar.Settings.positionUsing = bar.getPositioningCSS() }
                css(barSelect, barPositionCSS(n, speed, ease));
                if (n === 1) {
                    css(progress, { transition: "none", opacity: 1 });
                    progress.offsetWidth;
                    setTimeout(function () {
                        css(progress, { transition: "all " + speed + "ms linear", opacity: 0 });
                        setTimeout(function () {
                            bar.remove();
                            next()
                        }, speed)
                    }, speed)
                } else { setTimeout(next, speed) }
            });
            return this
        };
        bar.isStarted = function () { return typeof bar.status === "number" };
        bar.start = function () {
            if (!bar.status) { bar.set(0) }
            var work = function () {
                setTimeout(function () {
                    if (!bar.status) { return }
                    bar.trickle();
                    work()
                }, bar.Settings.trickleSpeed)
            };
            if (bar.Settings.trickle) { work() }
            return this
        };
        bar.done = function (force) { if (!force && !bar.status) { return this } return bar.inc(0.3 + 0.5 * Math.random()).set(1) };
        bar.inc = function (amount) {
            var n = bar.status;
            if (!n) { return bar.start() } else {
                if (typeof amount !== "number") { amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95) }
                n = clamp(n + amount, 0, 0.994);
                return bar.set(n)
            }
        };
        bar.trickle = function () { return bar.inc(Math.random() * bar.Settings.trickleRate) };
        bar.render = function (fromStart) {
            if (bar.isRendered()) { return document.getElementById("progress-bar") }
            addClass(document.documentElement, "nprogress-busy");
            var progress = document.createElement("div");
            progress.id = "progress-bar";
            progress.innerHTML = bar.Settings.template;
            var barSelect = progress.querySelector(bar.Settings.barSelector),
                perc = fromStart ? "-100" : toBarPerc(bar.status || 0),
                parent = document.querySelector(bar.Settings.parent),
                spinner;
            css(barSelect, { transition: "all 0 linear", transform: "translate3d(" + perc + "%,0,0)" });
            if (!bar.Settings.showSpinner) {
                spinner = progress.querySelector(bar.Settings.spinnerSelector);
                spinner && removeElement(spinner)
            }
            if (parent != document.body) { addClass(parent, "nprogress-custom-parent") }
            parent.appendChild(progress);
            $("#" + progress.id + " .bar").css({ "background": bar.Settings.color });
            $("#" + progress.id + " .peg").css({ "box-shadow": "0 0 10px " + bar.Settings.color + ",0 0 5px " + bar.Settings.color });
            $("#" + progress.id + " .spinner-icon").css({ "border-top-color": bar.Settings.color, "border-left-color": bar.Settings.color });
            return progress
        };
        bar.remove = function () {
            removeClass(document.documentElement, "nprogress-busy");
            removeClass(document.querySelector(bar.Settings.parent), "nprogress-custom-parent");
            var progress = document.getElementById("progress-bar");
            progress && removeElement(progress)
        };
        bar.isRendered = function () { return !!document.getElementById("progress-bar") };
        bar.getPositioningCSS = function () { var bodyStyle = document.body.style; var vendorPrefix = ("WebkitTransform" in bodyStyle) ? "Webkit" : ("MozTransform" in bodyStyle) ? "Moz" : ("msTransform" in bodyStyle) ? "ms" : ("OTransform" in bodyStyle) ? "O" : ""; if (vendorPrefix + "Perspective" in bodyStyle) { return "translate3d" } else { if (vendorPrefix + "Transform" in bodyStyle) { return "translate" } else { return "margin" } } };

        function clamp(n, min, max) { if (n < min) { return min } if (n > max) { return max } return n }

        function toBarPerc(n) { return (-1 + n) * 100 }

        function barPositionCSS(n, speed, ease) {
            var barCSS;
            if (bar.Settings.positionUsing === "translate3d") { barCSS = { transform: "translate3d(" + toBarPerc(n) + "%,0,0)" } } else { if (Settings.positionUsing === "translate") { barCSS = { transform: "translate(" + toBarPerc(n) + "%,0)" } } else { barCSS = { "margin-left": toBarPerc(n) + "%" } } }
            barCSS.transition = "all " + speed + "ms " + ease;
            return barCSS
        }
        var queue = (function () {
            var pending = [];

            function next() { var fn = pending.shift(); if (fn) { fn(next) } }
            return function (fn) { pending.push(fn); if (pending.length == 1) { next() } }
        })();
        var css = (function () {
            var cssPrefixes = ["Webkit", "O", "Moz", "ms"],
                cssProps = {};

            function camelCase(string) { return string.replace(/^-ms-/, "ms-").replace(/-([\da-z])/gi, function (match, varter) { return varter.toUpperCase() }) }

            function getVendorProp(name) {
                var style = document.body.style;
                if (name in style) { return name }
                var i = cssPrefixes.length,
                    capName = name.charAt(0).toUpperCase() + name.slice(1),
                    vendorName;
                while (i--) { vendorName = cssPrefixes[i] + capName; if (vendorName in style) { return vendorName } }
                return name
            }

            function getStyleProp(name) { name = camelCase(name); return cssProps[name] || (cssProps[name] = getVendorProp(name)) }

            function applyCss(element, prop, value) {
                prop = getStyleProp(prop);
                element.style[prop] = value
            }
            return function (element, properties) {
                var args = arguments,
                    prop, value;
                if (args.length == 2) { for (prop in properties) { value = properties[prop]; if (value !== undefined && properties.hasOwnProperty(prop)) { applyCss(element, prop, value) } } } else { applyCss(element, args[1], args[2]) }
            }
        })();

        function hasClass(element, name) { var list = typeof element == "string" ? element : classList(element); return list.indexOf(" " + name + " ") >= 0 }

        function addClass(element, name) {
            var oldList = classList(element),
                newList = oldList + name;
            if (hasClass(oldList, name)) { return }
            element.className = newList.substring(1)
        }

        function removeClass(element, name) {
            var oldList = classList(element),
                newList;
            if (!hasClass(element, name)) { return }
            newList = oldList.replace(" " + name + " ", " ");
            element.className = newList.substring(1, newList.length - 1)
        }

        function classList(element) { return (" " + (element.className || "") + " ").replace(/\s+/gi, " ") }

        function removeElement(element) { element && element.parentNode && element.parentNode.removeChild(element) }
        return bar
    };
    /**
     * 锁定界面
     */
    Layout.prototype.LockLayout = function (callback) {
        var $leave = $('.modal-leave-long-time').modal({
            blurring: true,
            closable: false,
            onVisible: function () {
                if (typeof callback == "function") {
                    callback()
                }
            },
            onDeny: function () {
                return false;
            },
            onApprove: function () {
                $('.modal-leave-long-time .err-message').html('&nbsp;');
                $.ajax({
                    url: window.location.href + "/check-password",
                    data: { pwd: $('input[name="leave-password"]').val(), _r: Math.random() },
                    success: function (res) {
                        if (res.success) {
                            delete layout.isLockLayout;
                            $leave.modal('hide');
                            $('input[name="leave-password"]').val('')
                        } else {
                            $('.modal-leave-long-time .err-message').html(res.message);
                        }
                    }
                })
                return false
            }
        }).modal('show')
    }

    /**
     * 更新用户信息 同步到页面
     */
    Layout.prototype.UserChange = function (profile) {
        if (profile.face) {
            $('.dropdown-portrait').find('.profile-user-face').attr('src', profile.face);
        }
        if (profile.nickname) {
            $('.dropdown-portrait').find('.profile-user-name').html(profile.nickname);
        }
    }
    /**
     * 加载一个页面
     * @param {string} url 页面地址
     * @param {string} title 页面标题
     * @param {HTML} action 确定与取消按钮
     * @param {bool} closable 是否有删除按钮
     * @param {string} size 页面大小 class
     * @returns modal
     */
    Layout.prototype.Page = function (url, title = '', action = {}, closable = true, size = 'longer', height = "calc(80vh - 10rem)") {
        var $frame = '<iframe id="frame-page-fliud" src="' + url + '" frameborder="0" scrolling="auto" style="width: 100%; height: ' + height + ';"></iframe>';
        var $modal = this.modal($frame, {
            header: title,
            classList: size || 'longer',
            closable: closable == false ? false : true,
            actions: action
        });
        $modal.find('#frame-page-fliud').parent('div.content').css({ 'padding': '0', "overflow": "hidden" });
        return $modal;
    }
    return Layout;
}())
$.ajaxSetup({
    type: "POST",
    dataType: "json",
    async: true,
    error: function (xhr, type, message) {
        try {
            layout.notify(message, { class: type });
        } catch (e) {
            console.log(e);
            layout.notify(e, { title: 'Error!', class: 'error' });
            //alert('error');
        }
    }
})
var layout = new Layout();
