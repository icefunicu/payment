const _pdf = require('jspdf');
const _lodash = require('lodash');
const path = require('path');
const constant = require('../config/constant');
/**
 * PDF 文件
 */
module.exports = {
    /**
     * 输出开户信
     * @param {Request} req 请求体
     * @param {Object} member 商户
     * @returns 文档路径
     */
    outAccountLetter(req, member) {
        if (!member) {
            throw `商户不存在`;
        }
        let pdf = new _pdf.jsPDF('p', 'px');
        pdf.setDocumentProperties({
            title: `${member['mbr-name']} - 开户信`,
            subject: member['mbr-name'],
            author: 'SalsNET',
            keywords: `${member['mbr-name']} 不可公开`,
            creator: 'SalsNET',
        });
        pdf.addFont('./assets/fonts/simkai.ttf', 'b', 'normal');
        pdf.setFont('b');
        pdf.setFontSize(40);
        pdf.setTextColor('#ff0000');
        pdf.text('开 户 信', 160, 50);
        pdf.setFontSize(16);
        pdf.setTextColor('#333');
        pdf.text(`尊敬的 ${member['mbr-name']} 您好,您的支付参数如下:`, 20, 70);
        pdf.text(`登录账号:${member['mbr-account']}`, 20, 90);
        pdf.text('登录密码:(默认为:123456,如丢失请联系管理员重置)', 20, 110);
        pdf.text(`商户ID:${member['mbr-pid']}`, 20, 130);
        pdf.setTextColor('#2185d0');
        pdf.text(`支付签名KEY:${member['mbr-sign-key']} (前后无空格,请妥善管理)`, 20, 150);
        pdf.text(`回调签名KEY:同上`, 20, 170);
        pdf.setTextColor('#333');
        pdf.text(`提款密码:默认为123456,如果您已修改,请使用修改之后密码`, 20, 190);
        pdf.text(`统一收单地址:{domain}/gateway/order`, 20, 210);
        pdf.text(`API代发地址:{domain}/gateway/payment`, 20, 230);
        
        pdf.text(`订单查询地址:{domain}/gateway/list`, 20, 250);

        
        // pdf.line(20, 250, 420, 250);
        // pdf.text(`结算周期:${member['mbr-risk']['frequency']}`, 20, 240);
        // pdf.text(`提款单笔限额:${member['mbr-risk']['draw_max_one']}`, 20, 260);
        // pdf.text(`提款单日限额:${member['mbr-risk']['draw_max_day']}`, 20, 280);


        let file_path = path.join(constant.TEMP_DIR, _lodash.random(10, 65535).toString());
        pdf.save(file_path);
        return path.resolve(file_path);
    }
}