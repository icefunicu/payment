/**
    var mail = require('./utils/email')
    mail.sendMail({
    from: '"来源" <chianmain@163.com>', // sender address
    to: 'ryckbxciur@iubridge.com', // list of receivers
    subject: '主题 带附件', // Subject line
    priority: 'high',
    // 附件
    attachments: [
        {
            filename: 'tool.js',            // 改成你的附件名
            path: './utils/tool.js',  // 改成你的附件路径
            cid: '00000001'                 // cid可被邮件使用
        },
    ],
    // 发送text或者html格式
    // text: 'Hello world?', // plain text body
    html: '<h2>大文本</h2><p>小文本</p>'
    }).then(a => {
        cons ole.log('send aa', a)
    }).catch(q => {
        cons ole.log('send err', q)
    })
 */

/**
 * Email 邮件
 */
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'smtp.163.com',
    host: "smtp.163.com",
    secureConnection: true,
    port: 465,

    auth: {
        user: 'chianmain',
        pass: 'RUUBMYMPLEUUAMEW',
    }
});

module.exports = {
    sendMail(mail) {
        mail.from = '"玩友中心" <chianmain@163.com>';
        return new Promise((resolve, reject) => {
            transporter.sendMail(mail, (error, info) => {
                if (error) {
                    reject(error);
                    return
                }
                resolve(info)
            });
        });
    }
}