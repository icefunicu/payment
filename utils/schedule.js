/**
 *  定时任务
 *  每分钟的第30秒触发： '30 * * * * *'
    每小时的1分30秒触发 ：'30 1 * * * *'
    每天的凌晨1点1分30秒触发 ：'30 1 1 * * *'
    每月的1日1点1分30秒触发 ：'30 1 1 1 * *'
    2016年的1月1日1点1分30秒触发 ：'30 1 1 1 2016 *'
    每周1的1点1分30秒触发 ：'30 1 1 * * 1'
    每隔5秒执行一次：*\/5 * * * * ?
    每隔10分钟执行一次：0 *\/10 * * * ?
    每天23点执行一次：0 0 23 * * ?
    每天凌晨1点执行一次：0 0 1 * * ?
    每月1号凌晨1点执行一次：0 0 1 1 * ?
    每月最后一天23点执行一次：0 0 23 L * ?
    每周星期天凌晨1点实行一次：0 0 1 ? * L
    在26分、29分、33分执行一次：0 26,29,33 * * * ?
    每天的0点、13点、18点、21点都执行一次：0 0 0,13,18,21 * * ?
    Seconds (秒) ：可以用数字0－59 表示；
    Minutes(分) ：可以用数字0－59 表示；
    Hours(时) ：可以用数字0-23表示；
    Day-of-Month(天) ：可以用数字1-31 中的任一一个值，但要注意一些特别的月份2月份没有只能1-28，有些月份没有31；
    Month(月) ：可以用0-11 或用字符串 “JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV and DEC” 表示；
    Day-of-Week(*每周*)*：*可以用数字1-7表示（1 ＝ 星期日）或用字符口串“SUN, MON, TUE, WED, THU, FRI and SAT”表示；
    “/”：为特别单位，表示为“每”如“0/10”表示每隔10分钟执行一次,“0”表示为从“0”分开始, “3/20”表示表示每隔20分钟执行一次，“3”表示从第3分钟开始执行；
    “?”：表示每月的某一天，或第周的某一天；
    “L”：用于每月，或每周，表示为每月的最后一天，或每个月的最后星期几如“6L”表示“每月的最后一个星期五”；
    “W”：表示为最近工作日，如“15W”放在每月（day-of-month）字段上表示为“到本月15日最近的工作日”；
    “#”：是用来指定“的”每月第n个工作日,例 在每周（day-of-week）这个字段中内容为”6#3” or “FRI#3” 则表示“每月第三个星期五”；
    “*” 代表整个时间段。

*的序号	    说明	必填	允许填写的值	允许的通配符
    1	    秒	    是	    0-59	        , - * /
    2	    分	    是	    0-59	        , - * /
    3	    时	    是	    0-23	        , - * /
    4	    日	    是	    1-31	        , - * ? / L W
    5	    月	    是	    1-12 / JAN-DEC	, - * /
    6	    周	    是	    1-7 or SUN-SAT	, - * ? / L #
    7	    年	    否	    1970-2099	    , - * / 
    ---------------------------------
    每个参数还可以传入数值范围:
    秒、分、时、日、月、周几 [、年]
 */
/**
 * 
 */
const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');
const zip = require('./compress')
const mongo = require('../config/database');
const constant = require('../config/constant');
const { OrderState } = require('../scripts/gateway/order');



const task_ticks = {
    /**
     * 每天的 04：30：00 执行
     */
    backup_app: '0 30 4 * * *',
    /**
     * 每天的 03：20：00 执行
     */
    clear_temp: '0 20 3 * * *',

    /**
     * 解析域名 每间隔 20分钟 执行一次(所有事件 莫20 为0时 执行)
     */
    domain_pars: '0 */20 * * * *'
}

let tasks = [];
const task1 = () => {
    //每分钟的第30秒定时执行一次:
    let cron = schedule.scheduleJob('30 * * * * *', () => {
        console.log('task1:' + new Date());
    });
    tasks.push(cron);
}
/**
 *  // TODO :性能消耗巨大,后期需要优化
 * 订单维护订单
 * 设置订单状态
 */
const order_maintenance = () => {
    console.log('[定时任务] \t{订单维护}] \t\t[已准备!]');
    let cron = schedule.scheduleJob('* * * * * *', async () => {
        try {
            let docs = await mongo.Coll('orders').updateMany(
                { 'page.endTime': { $lte: Date.now() } },
                { $set: { state: OrderState.TIMEOUT } },
                { upsert: false });

            if (docs.nModified > 0) {
                console.log(`维护订单${docs.nModified}个`);
            }

        } catch (err) {
            console.error('订单维护:', err);
        } finally {

        }
    });
    tasks.push(cron);
}
/**
 * 定时备份网站系统
 */
const backup_app = () => {
    console.log('[定时任务] \t{备份网站系统}] \t\t[已准备!]');
    //每天执行 [在清理临时文件后备份系统]
    let cron = schedule.scheduleJob(task_ticks.backup_app, async () => {
        console.log('开始备份网站系统:');
        try {
            let out_file = await zip.Backup(constant.BACKUP_SITE_EXCLUDE);
            console.log('备份成功:', out_file);
        } catch (err) {
            console.log('网站备份错误:', err);
        } finally {
            console.log('网站备份完成');
        }
    })
    tasks.push(cron);
}
/**
 * 定时清理temp文件夹
 */
const clear_temp = () => {
    console.log('[定时任务] \t{清理 temp 文件夹}] \t[已准备!]');
    let cron = schedule.scheduleJob(task_ticks.clear_temp, () => {
        console.log('清理temp文件夹:');
        try {
            fs.rmSync(path.resolve(constant.TEMP_DIR), { recursive: true, force: true })
            fs.mkdirSync(path.resolve(constant.TEMP_DIR), { recursive: true });
        } catch (err) {
            console.log('清理temp文件夹 错误:', err);
        } finally {
            console.log('清理temp文件夹 完成');
        }
    })
    tasks.push(cron);

}
const order_notify_sends = () => {
    console.log('[定时任务] \t{异步通知}] \t\t[已准备!]');
    let cron = schedule.scheduleJob('*/30 * * * * *', async () => {
         console.pay('发送异步通知')
    });
    tasks.push(cron);
}

/**
 * 域名解析
 */
const domain_parsing = async (token, domain) => {
    console.log('[定时任务] \t{域名自动解析}] \t\t[已准备!]');
    let cron = schedule.scheduleJob(task_ticks.domain_pars, async () => {
        console.log(`${new Date().toLocaleTimeString()}域名【${domain}】解析开始`);
        require('./domain_pars').DoainPars(token, domain);
        
 
    });
    
    tasks.push(cron);
}

module.exports = {
    /**
     * 开启定时任务
     */
    start() {
        console.log('定时任务已启动:');
        
        //order_notify_sends();
        clear_temp();
        backup_app();
        
        //order_maintenance();
        
        console.log('定时任务启动完成 !');
    },
    /**
     * 停止所有定时任务
     */
    stop() {
        tasks.forEach((cron, index) => {
            cron.cancel();
        });
        console.log(' 定时任务已停止 ! ');
    }
}
