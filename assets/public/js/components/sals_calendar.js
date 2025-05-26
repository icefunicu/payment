/**
 * 日历控件
 */
var Sals = Sals || {}
Sals.prototype.calendar = function () {
    var langCalendar = window.localStorage.getItem('lang-calendar');
    function bound(lang) {
        var dataFormatter = function (date, settings) {
            if (!date) return '';
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var day = date.getDate();
            month = month < 10 ? '0' + month : month;
            day = day < 10 ? '0' + day : day;
            return year + '-' + month + '-' + day;
        };
        $('.calendar.date').calendar({
            type: 'date',
            formatter: { // 自定义日期的格式
                date: dataFormatter
            },
            text: lang.calendar
        });
        $('.calendar.time').calendar({
            type: 'time',
            text: lang.calendar,
            ampm: false,
            formatter: {
                time: 'H:mm',
                cellTime: 'H:mm'
              }
        })
        $('.calendar.datetime').calendar({
            ampm: false,
            text: lang.calendar,
            formatter: { // 自定义日期的格式
                date: dataFormatter,
                time: 'H:mm',
                cellTime: 'H:mm'
            }
        })
    }
    if (!langCalendar) {
        // 语言
        this.Loader.js(['/cgi-bin/i18n/javascript'], function (res) {
            window.localStorage.setItem('lang-calendar',JSON.stringify(lang));
            bound(lang);
        });
    }else{
        bound(JSON.parse(langCalendar));
    }
}
sals.calendar()