/**
 * 消息通知调度
 */
const email = require('./email')

module.exports = {
    /**
     * 发送通知邮件
     * @param {object} mail 通知内容
     */
    SendMail(mail) {
        // try{
        //     mail.to = "sals_fankui@yeah.net";
        //     email.sendMail(mail).then(() => {
        //         console.log('邮件通知成功')
        //     }).catch(err => {
        //         console.log('邮件通知失败', err);
        //     });
        // }catch(e){
        //     console.error('邮件通知异常:',e)
        // }
        
    }
}