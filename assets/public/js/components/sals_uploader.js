/**
 * 文件上传控件
 */
var Sals = Sals || {}
Sals.prototype.uploader = function (callback) {
    let $ = top.$,layout=top.layout;
    var settings = {}
    var $modal = undefined;
    function init_window() {
        var lang = window.FILE_MANAGE_LANGUAGE;
        var $modal = layout.modal('<div class="ui four cards files-contents"></div>', {
            classList: 'small',
            allowMultiple: true,
            centered: false,
            closable: true,
            title: lang.title,
            transition: layout.Animations.fade,
        });
        $($modal).append($('#modal-template').html());
        setTimeout(function () {/** 需要延时绑定 原因未知 */
            $modal.find('.dropdown-ctrls').each(function (i, dom) {
                $(dom).dropdown({ direction: 'upward', action: 'hide' });
            })
        }, 800);

        $modal.find('a.ctrl-refresh').on('click', function (e) {
            load_files(undefined, { originalname: null }, true)
        })
        $modal.find('a.ctrl-new-folder').on('click', function (e) {
            new_folder()
        })
        $modal.find('a.ctrl-upload').on('click', function (e) {
            file_upload();
        })
        $modal.find('a.ctrl-image').on('click', function (e) {
            image_upload();
        })
        $modal.find('a.ctrl-more-toggle').on('click', function (e) {
            more_toggle();
        })
        $modal.find('a.ctrl-more-select-all').on('click', function (e) {
            more_select('all');
        })
        $modal.find('a.ctrl-more-select-invert').on('click', function (e) {
            more_select('invert');
        })
        $modal.find('a.ctrl-more-select-none').on('click', function (e) {
            more_select('none');
        })
        $modal.find('a.ctrl-success-action').on('click', function (e) {
            file_select_success()
        })
        $modal.find('.ctrl-parent-button').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (!$(this).hasClass('disabled')) {
                if ($modal.data("parent-path") == '//') {
                    $modal.data("parent-path", '/')
                }
                load_files($modal.data("parent-path"), { originalname: null });
            }
        })
        return $modal;
    }

    function load_files(path, folder, isRefresh) {
        if (!path || path == undefined) {
            path = $modal.data("dir-path");
        }
        var lang = window.FILE_MANAGE_LANGUAGE;
        var card_colors = ['red', 'green', 'orange', 'olive', 'teal', 'blue', 'violet', 'purple', 'pink', 'brown', 'grey', 'black'];
        $.ajax({
            data: { parent: path },
            url: "/files/file-manage",
            success: function (res) {
                //当前位置
                $modal.data({ "dir-path": res.path, "parent-path": res.parent });
                //
                if (!isRefresh) {
                    var io_path = $modal.find('.ctrl-io-path').text();
                    if (folder) {
                        if (folder.originalname == null) {
                            io_path = io_path.substring(0, io_path.length - 1);
                            io_path = io_path.substring(0, io_path.lastIndexOf('/') + 1);
                        } else {
                            io_path += folder.originalname + '/';
                        }
                        $modal.find('.ctrl-io-path').text(io_path);
                    } else {
                        $modal.find('.ctrl-io-path').text(res.path);
                    }
                }

                if (res.path == '/') {
                    $modal.find('.ctrl-parent-button').addClass('disabled')
                } else {
                    $modal.find('.ctrl-parent-button').removeClass('disabled')
                }
                var $contens = $modal.find('.files-contents');
                $contens.empty()
                if (res.files.length < 1) {
                    $contens.html(lang.no_file);//无文件
                } else {
                    $(res.files).each(function (index, file) {
                        var $card = $('<div class="card raised link ui"></div>');
                        if (file.type == 'FOLDER') {
                            $card.append('<div class="content text-center" style="color:#888"><i class="icon folder outline huge"></i></div>').addClass('yellow');
                        } else {
                            var color = card_colors[Math.floor(Math.random() * card_colors.length)];
                            $card.addClass(color);
                            //多选框
                            $card.append('<a class="ui mini right corner label more-select-control hidden"><i class="check icon"></i></a>')
                            if (file.isImage) {
                                $card.append('<div class="image"><img src="' + file.thumbnail + '"></div>');
                            } else {
                                $card.append('<div class="content text-center" style="color:#888"><i class="icon ' + file.icon + ' huge"></i></div>');
                            }
                        }

                        var $extra = $('<div class="extra"></div>');
                        $extra.append('<span class="rename-text">' + file.originalname + '</span>');
                        $extra.append('<div class="ui input mini fluid hidden rename-input"><input class="rename-value" value="' + file.originalname + '" type="text" /></div>');
                        $card.append($extra);
                        $card.data('file', file);
                        $contens.append($card);
                        $card.on('click', function () {
                            if ($(this).find('.rename-input').is(':visible')) {
                                return false;
                            }
                            file_choose($(this).data('file'))
                        })
                    })

                    //多选模式
                    $('.more-select-control').on('click', function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        $(this).toggleClass('green');
                        if ($modal.find('.card.raised').find('a.more-select-control.green').length > 0) {
                            $('.ctrl-success-action').removeClass('disabled')
                        } else {
                            $('.ctrl-success-action').addClass('disabled')
                        }

                    })
                    more_toggle(false);
                    init_item_contextmenu($contens.find('.card'));
                }
            }
        })
    }


    function init_item_contextmenu($dom) {
        var lang = window.FILE_MANAGE_LANGUAGE.contextmenus;
        layout.Contextmenu({
            dom: $dom,
            items: {
                "download": { name: lang.file.download, icon: "icon download" },
                "preview": { name: lang.file.preview, icon: "icon photo video", hr: true },
                "rename": { name: lang.file.rename, icon: "icon i cursor" },
                "remove": { name: lang.file.remove, icon: "icon remove", hr: true },
                "attribute": { name: lang.file.attribute, icon: "icon file alternate outline", disable: true },
                "more": {
                    name: lang.file.more, icon: "icon paperclip", hidden: true,
                    items: {
                        "copy": { name: lang.file.copy, icon: "icon clone", disable: !true },
                        "paste": { name: lang.file.paste, icon: "icon paste" },
                        "cut": { name: lang.file.cut, icon: "icon cut", hr: true },
                        "replace": { name: lang.file.replace, icon: "icon retweet" },
                        "attribute": { name: lang.file.attribute, icon: "icon file alternate outline" }
                    }
                },
            },
            callback: function (g) {
                var file = $(g.element).data('file');
                //console.log('g.element', $(g.element).data('file'))
                switch (g.data) {
                    case 'rename':
                        $(g.element).find('.extra').find('.rename-text').hide();
                        $(g.element).find('.extra').find('.rename-input').removeClass('hidden');
                        $(document.body).on('keydown', function (event) {
                            if (event.key == 'Enter') {
                                event.preventDefault();
                                event.stopPropagation();
                                var new_name = $(g.element).find('.extra').find('input.rename-value').val();
                                $.ajax({
                                    url: '/files/command',
                                    data: { new_name: new_name, path: file.path, originalname: file.originalname, fileType: file.type, key: file.file_key, type: 'rename', _r: Math.random() },
                                    success: function (res) {
                                        if (res.success) {
                                            $(g.element).find('.extra').find('.rename-text').text(new_name).show();
                                            $(g.element).find('.extra').find('.rename-input').addClass('hidden');
                                            //本地重命名 
                                            file.originalname = new_name;
                                            $(g.element).data('file', file);
                                        } else {
                                            layout.notify(res.message, { class: 'error' });
                                        }
                                    }
                                })
                            }
                            if (event.key == 'Escape') {
                                event.stopPropagation();
                                event.preventDefault();
                                $(g.element).find('.extra').find('.rename-text').show();
                                $(g.element).find('.extra').find('.rename-input').addClass('hidden');
                            }
                        });
                        break;
                    case "download":
                    case "preview":
                        window.open(file.url)
                        break;
                    case "attribute":

                        break;
                    case 'remove':
                        layout.confirm(lang.file['remove-confirm'], function (rest) {
                            if (!rest) {
                                return;
                            }
                            $.ajax({
                                url: '/files/command',
                                data: { key: file.file_key, fileType: file.type, type: 'remove', _r: Math.random() },
                                success: function (res) {
                                    if (res.success) {
                                        load_files(undefined, {}, true);
                                    } else {
                                        layout.notify(res.message, { class: 'error' })
                                    }
                                }
                            })
                        })
                        break;
                }
            }
        })
    }
    if (!window.FILE_MANAGE_LANGUAGE) {
        $.ajax({
            url: "/files/file-manage-language",
            success: function (res) {
                window.FILE_MANAGE_LANGUAGE = res;
                $modal = init_window();
                load_files('/');
            }
        })
    } else {
        $modal = init_window();
        load_files('/');
    }
    function more_toggle(onOff) {
        if (onOff === false) {
            if ($('.toggle-switch-button').hasClass('toggle-is-on')) {
                $modal.find('.more-select-control').removeClass('hidden');
            }
            return
        }
        $('.toggle-switch-button').toggleClass('toggle-is-on')
        if ($('.toggle-switch-button').hasClass('toggle-is-on')) {
            $modal.find('.more-select-control').removeClass('hidden').removeClass('green')
            $modal.find('.toggle-switch-button').find('i.toggle.icon').removeClass('off').addClass('on')
            $modal.find('.toggle-switch-button').find('a.ctrl-more-select').removeClass('disabled')
        } else {
            $modal.find('.more-select-control').addClass('hidden').removeClass('green')
            $modal.find('.toggle-switch-button').find('i.toggle.icon').removeClass('on').addClass('off')
            $modal.find('.toggle-switch-button').find('a.ctrl-more-select').addClass('disabled');
            $modal.find('.ctrl-success-action').addClass('disabled')
        }
    }
    function more_select(type) {
        switch (type) {
            case 'all':
                $modal.find('.more-select-control').addClass('green');
                break
            case 'none':
                $modal.find('.more-select-control').removeClass('green');
                break;
            case 'invert':
                $modal.find('.more-select-control').toggleClass('green');
                break;
        }
        if ($modal.find('.card.raised').find('a.more-select-control.green').length > 0) {
            $('.ctrl-success-action').removeClass('disabled')
        } else {
            $('.ctrl-success-action').addClass('disabled')
        }
    }
    function file_select_success() {
        if ($('.ctrl-success-action').hasClass('disabled')) {
            return;
        }
        var $moSelect = $modal.find('.card.raised').find('a.more-select-control.green');
        var selectFile = []
        $moSelect.each(function (i, dom) {
            selectFile.push($(dom).parent('.card').data('file'))
        })
        if (selectFile.length > 0) {
            $modal.modal('hide');
            if (typeof callback == 'function') {
                callback(selectFile);
            }
        }
    }
    function new_folder() {
        layout.prompt(window.FILE_MANAGE_LANGUAGE.contextmenus.file['new-folder'], function (text) {
            $.ajax({
                data: { _r: Math.random(), folder: text, cur: $modal.data('dir-path') },
                url: "/files/file-new-folder",
                success: function (res) {
                    if (res.success) {
                        load_files(undefined, {}, true)
                    } else {
                        layout.tip(res.message)
                    }
                }
            })
        }, window.FILE_MANAGE_LANGUAGE.contextmenus.file.folder)
    }
    function send_file() {
        $('input.upload-input-control').remove();

        var $file = $('<input type="file" name="resources" autocomplete="off" style="display:none">');
        $file.attr({ "class": "upload-input-control", 'accept': settings.accept, 'multiple': settings.multiple });
        $(document.body).append($file);
        $file.on('change', function () {
            //var f = $file[0].files[0]
            var formData = new FormData();
            formData.append('virtual', $modal.data('dir-path'));
            $($file[0].files).each(function (i, f) {
                formData.append('file', f);
            })

            var request = new XMLHttpRequest();
            request.onloadend = function (evt) {
                var jon = JSON.parse(evt.target.responseText);
                if (jon.success) {
                    load_files(undefined, {}, true);
                }
            }
            request.open("POST", '/files/file-upload'); // 设置服务URL
            request.send(formData);  // 发送表单数据
        })
        setTimeout(function () {
            $file.trigger('click')
        }, 200)
    }
    function file_upload() {
        settings.multiple = false;
        send_file();
    }
    function image_upload() {
        settings.multiple = true;
        send_file();
    }
    //选择了文件
    function file_choose(file) {
        if (file.type == 'FOLDER') {
            load_files(file.path, file);
            return
        }
        $modal.modal('hide');
        if (typeof callback == 'function') {
            callback([file]);
        }
    }
}
