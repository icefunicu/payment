/**
 * 数据表格
 */
var Sals = Sals || {}
Sals.prototype.grid = function (selecter, columns,cb, pageSize = 20) {
    var $table = $('<table></table>').addClass('ui sortable padded small celled fixed selectable striped table');
    $table.sort = {}
    $table.pageIndex = 1;
    $table.pageSize = pageSize;
    //head
    var $thead = $('<thead></thead>');
    var $tr = $('<tr></tr>');
    $(columns).each(function (i, column) {
        var $th = $('<th></th>').data('field', column.field).data('formater', column.formater);
        //
        if (column.field == 'row-handle') {
            //column = { header: '#', width: '64px', class: 'center aligned' }
            $th.data('handle', column.handle);
        }

        if (column.field == 'row-number') {
            column = { header: '#', width: '64px', class: 'center aligned' }
        }
        if ('row-checkbox' == column.field) {
            column = { header: '<div class="ui toggle checkbox mini checkbox-all-ctrl"><input type="checkbox" ><label>&nbsp;</label></div>', width: '70px', class: 'center aligned' }
        }
        $th.append('<span>' + column.header + '</span>');
        if (column.class) {
            $th.addClass(column.class);
        }
        if (column.width) {
            $th.css("width", column.width);
        }

        //排序
        if (column.sorted) {
            var $sort = $('<i></i>').addClass('icon sort grey');
            $th.append($sort).data('sort', '0');
            $th.on('click', function () {
                var $thSort = $(this);
                switch ($thSort.data('sort')) {
                    case '0':
                        $thSort.data('sort', '1').find('i.icon').removeClass('grey down up').addClass('down');
                        $table.sort[column.field] = 'aesc';
                        break;
                    case '1':
                        $thSort.data('sort', '-1').find('i.icon').removeClass('grey down up').addClass('up');
                        $table.sort[column.field] = 'desc';
                        break;
                    case '-1':
                        $thSort.data('sort', '0').find('i.icon').removeClass('down up').addClass('grey');
                        delete $table.sort[column.field];
                        break;
                }
                $table.pageIndex = 1;
                $table.LoadData($table.dataurl);
            })
        }
        $tr.append($th);
    })
    $thead.append($tr);
    $table.append($thead);
    var $tbody = $('<tbody></tbody>');
    $table.append($tbody);
    $(selecter).append($table);
    /**
     *  
     */

    $table.setChecked = function () {
        /* 全选复选框 */ 
        var $selectAll = $table.find('thead div.checkbox-all-ctrl');
        $selectAll.checkbox({
            onChange:function(){
               delete $table.isUser; 
            },
            onChecked: function () { 
                if (!$table.isUser) {
                    $table.find('tbody div.grid-row-checkbox').checkbox('check');
                }
            },
            onUnchecked: function () { 
                if (!$table.isUser) {
                    $table.find('tbody div.grid-row-checkbox').checkbox('uncheck');
                }
            }
        });
        $table.find('tbody div.grid-row-checkbox').checkbox({
            onChange: function () {
                $table.isUser = true;
                if ($table.find('tbody div.grid-row-checkbox').checkbox('is checked').includes(false)) {
                    $table.find('thead div.checkbox-all-ctrl').checkbox('uncheck');
                } else {
                    $table.find('thead div.checkbox-all-ctrl').checkbox('check');
                }
            }
        })
    }
    $table.getChecked = function () {
        var checked = []
        $('.grid-row-checkbox').each(function (i, dom) {
            if ($(dom).checkbox('is checked')) {
                checked.push($(dom).parents('tr').data('row-data'))
            }
        })
        return checked;
    }

    /**
     * 渲染一行数据
     */
    $table.AddRow = function (row, index, datas) {
        var $tr = $('<tr></tr>').data('row-data', row);
        $table.find('thead tr th').each(function (i, ele) {
            var $td = $('<td></td>');
            //管理
            if ($(ele).data('field') == 'row-handle') {
                var handles = $(ele).data('handle');
                $(handles).each(function (x, btn) {
                    var $btn = $('<button></button>');
                    if (btn.icon) {
                        $btn.append('<i class="' + btn.icon + '"></i>');
                    }
                    $btn.addClass(btn.class).append(btn.text);
                    $btn.on('click', function () {
                        btn.action(row, datas);
                    })
                    $td.append($btn);
                });
                $td.appendTo($tr);
            }
            //行号
            if ($(ele).data('field') == 'row-number') {
                $td.append(((index + 1) + (($table.pageIndex - 1) * $table.pageSize))).appendTo($tr);
                $td.addClass('center aligned');
            }
            //复选框
            if ($(ele).data('field') == 'row-checkbox') {
                $td.append('<div class="ui toggle checkbox mini grid-row-checkbox"><input type="checkbox" name="grid-row-checkbox"><label>&nbsp;</label></div>').appendTo($tr);
                $td.addClass('center aligned');
            }
            //数值
            var val = row[$(ele).data('field')];
            var formater = $(ele).data('formater');
            if (formater) {
                val = formater(val, row, index, datas);
            }
            $td.append(val).appendTo($tr);
        });
        $tbody.append($tr);

    }
    /**
     * 重新加载
     */
    $table.Reload = function (data,callback) {
        $table.LoadData( $table.dataurl,data||$table.screening,callback) ;
    }
    /**
     * 加载数据
     */
    $table.LoadData = function (url,data,callback) {
        if (!url) {
            return;
        }
        var langGrid = window.localStorage.getItem('lang-grid');
        if (!langGrid) {
            // 语言
            sals.Loader.js(['/cgi-bin/i18n/grid'], function (res) {
                window.localStorage.setItem('lang-grid', JSON.stringify(lang));
                langGrid = lang;
                _load(data,callback);
            });
        } else {
            langGrid = JSON.parse(langGrid);
            _load(data,callback);
        }
        /**
         * 首次加载语言
         */
        function _load(data,callback) {
            data = $.extend(data, { "_t": Math.random(), "sort": JSON.stringify($table.sort), pageIndex: $table.pageIndex, pageSize: $table.pageSize })
            $table.dataurl = url;
            $table.screening = data;
            $tbody.empty(); 
            $table.find('thead div.checkbox-all-ctrl').checkbox('uncheck');
            $.ajax({
                url: url,
                data:data,
                success: function (res) {
                    if(typeof cb =='function'){
                        cb(res)
                    }
                    if (res.success) {
                        if (res.datas.length < 1) {
                            var $tr = $('<tr></tr>');
                            var $td = $('<td></td>').appendTo($tr);
                            $td.append(langGrid['no-data']).attr('colspan', $(columns).length).addClass('center aligned');
                            $tbody.append($tr);
                        }
                        $(res.datas).each(function (i, ele) {
                            $table.AddRow(ele, i, res.datas);
                        }); 
                        $table.Pagination(res.total);
                        if(typeof callback =='function'){
                            callback(res);
                        }
                        
                    } else {
                        if (!res.message) {
                            //load-data-error
                            res.message = langGrid['load-data-error'];//'load data error'
                        }
                        top.layout.notify(res.message, { class: 'error' });
                    }
                }
            })
        }

    }
    /**
     * 分页控件
     */
    $table.Pagination = function (total) {
        $table.find('tfoot').remove();
        var $pagination = $('<tfoot></tfoot>');
        $pagination.append('<tr><th colspan="' + $(columns).length + '"></th></tr>');
        if ($table.pageSize != false) {
            $pagination.find('tr th').append('<div class="ui mini right floated pagination menu"></div>');
            var $page = $pagination.find('div.pagination');
            // 计算分页 
            total = parseInt(total);
            var pageIndex = parseInt($table.pageIndex);
            if (isNaN(pageIndex) || pageSize < 1) {
                pageSize = 1;
            }
            var pageSize = $table.pageSize;
            if (isNaN(pageSize) || pageSize < 1) {
                pageSize = 20;
            }
            var total_pages = Math.ceil(total / pageSize);
            var page_item_size = pageIndex * pageSize;
            if (page_item_size > total) {
                page_item_size = total
            }
            var groups = total_pages < 5 ? total_pages : 5, halve = Math.floor((groups - 1) / 2),
                halve = Math.floor((groups - 1) / 2),
                end = Math.max(groups, (pageIndex + halve) > total_pages ? total_pages : (pageIndex + halve)),
                start = (end - groups) < 1 ? 1 : end - groups + 1;
            var $more_span = $('<div class="disabled item">...</div>');
            var $fast_backward = $('<a class="item icon disabled " data-page="1"><i class="icon fast backward"></i></a>');
            var $backward = $('<a class="item icon disabled"><i class="left chevron icon"></i></a>');
            var $forward = $('<a class="item icon"><i class="right chevron icon"></i></a>');
            var $fast_forward = $('<a class="item icon"><i class="icon fast forward"></i></a>').data('page', total_pages);
            var $last_page = $('<a class="item">{0}</a>'.replace('{0}', total_pages)).data('page', total_pages);
            $page.append($fast_backward);
            $page.append($backward);
            if (pageIndex < 2) {
                $backward.data('page', 1);
            } else {
                $backward.data('page', pageIndex - 1);
            }
            if (pageIndex < 2) {
                $backward.addClass('disabled');
                $fast_backward.addClass('disabled');
            } else {
                $backward.removeClass('disabled');
                $fast_backward.removeClass('disabled');
            }
            if (start > 1) {
                $page.append('<a class="item" data-page="1" >1</a>');
            }
            if (start > 2) {
                $page.append($more_span.clone());
            }

            while (start <= end) {
                $page.append('<a class="item" data-page="{value}" >{value}</a>'.replace(/{value}/gi, start++));
            }
            if (end < total_pages - 1) {
                $page.append($more_span.clone());
            }
            if (end < total_pages) {
                $page.append($last_page);
            }
            $page.append($forward);
            $page.append($fast_forward);

            if (pageIndex + 1 > total_pages) {
                $forward.data('page', total_pages);
            } else {
                $forward.data('page', pageIndex + 1);
            }

            if (pageIndex >= total_pages) {
                $forward.addClass('disabled');
                $fast_forward.addClass('disabled');
            } else {
                $forward.removeClass('disabled');
                $fast_forward.removeClass('disabled');
            }
            //渲染分页 

            $page.find('a.item').on('click', function () {
                $table.pageIndex = $(this).data('page');
                $table.LoadData($table.dataurl);
            });
            $page.find('a.item:not(.disabled)').each(function (i, dom) {
                if ($(dom).data('page') == pageIndex) {
                    $(dom).addClass('active disabled')
                }
            });
        }
        $table.append($pagination);
        setTimeout(function () {
            $table.setChecked();
            $table._add_button();
            $table._add_htmls();
        }, 10);
    }
    /**
     * 增加自定义按钮
     */
    $table.AddButton = function (buttons) {
        $table._CUS_BUTTONS = buttons;
    }
    /**
     * 增加自定意html代码
     * @param {string} html 自定他html代码
     */
    $table.AddHtml = function (html) {
        $table._CUS_HTMLS = html; 
    }
    $table._add_htmls=function(){
        var $td = $table.find('tfoot tr th');
        $td.find('div.left').append($table._CUS_HTMLS)
    }

    $table._add_button = function () {
        if (!$table.add_button_ed) {
            $table.add_button_ed = true;
            var $td = $table.find('tfoot tr th');
            //$td.find('div.left').remove();
            var $menu = $('<div class="ui mini left floated pagination menu"></div>');
            $td.append($menu);
            $($table._CUS_BUTTONS).each(function (i, button) {
                var $btn = $('<a class="item">' + button.text + '</a>');
                $menu.append($btn);
                if (button.handle && typeof button.handle == 'function') {
                    $btn.on('click', function () {
                        button.handle();
                    });
                }
            })
            delete $table.add_button_ed;
        }
    }
    return $table;

}

