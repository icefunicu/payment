

const http = require('../../utils/http');
const constant = require('../../config/constant');
module.exports = {

    /**
     * 是否为合法身份证号码
     * @param {string} idNumber 身份证号
     * @returns 
     */
    isIdCard(idNumber) {
        const pattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}(\d|X|x)$/;
        if (!pattern.test(idNumber)) {
            return false;
        }

        // 计算校验码
        const weights = Array.from({ length: 17 }, (_, n) => Math.pow(2, n) % 11);
        const total = weights.reduce((sum, weight, index) => sum + parseInt(idNumber[17 - index]) * weight, 0);
        const checkDigit = (12 - total % 11) % 11;

        // 检查校验码
        if (checkDigit === 10) {
            return idNumber[idNumber.length - 1].toUpperCase() === 'X';
        } else {
            return parseInt(idNumber[idNumber.length - 1]) === checkDigit;
        }
    },
    /**
     * 验证手机号码是否合法
     * @param {Sring} phone 手机号码
     * @returns 
     */
    isPhone(phone) {
        return /^((0\d{2,3}-\d{7,8})|(1[3584]\d{9}))$/.test(phone);
    },
    /**
     * 银行卡号luhn校验算法
     * luhn校验规则：16位银行卡号（19位通用）:
     * 1.将未带校验位的 15（或18）位卡号从右依次编号 1 到 15（18），位于奇数位号上的数字乘以 2。
     * 2.将奇位乘积的个十位全部相加，再加上所有偶数位上的数字。
     * 3.将加法和加上校验位能被 10 整除。
     * @param bankno 银行卡号
     * @returns
     */
    isBankCard(bankno) {
        if (!bankno) { return false; }
        var lastNum = bankno.substr(bankno.length - 1, 1);// 取出最后一位（与luhn进行比较）
        var first15Num = bankno.substr(0, bankno.length - 1);// 前15或18位
        var newArr = new Array();
        for (var i = first15Num.length - 1; i > -1; i--) { // 前15或18位倒序存进数组
            newArr.push(first15Num.substr(i, 1));
        }
        var arrJiShu = new Array(); // 奇数位*2的积 <9
        var arrJiShu2 = new Array(); // 奇数位*2的积 >9
        var arrOuShu = new Array(); // 偶数位数组
        for (var j = 0; j < newArr.length; j++) {
            if ((j + 1) % 2 == 1) {// 奇数位
                if (parseInt(newArr[j]) * 2 < 9) {
                    arrJiShu.push(parseInt(newArr[j]) * 2);
                } else {
                    arrJiShu2.push(parseInt(newArr[j]) * 2);
                }
            } else {
                arrOuShu.push(newArr[j]);// 偶数位
            }
        }

        var jishu_child1 = new Array();// 奇数位*2 >9 的分割之后的数组个位数
        var jishu_child2 = new Array();// 奇数位*2 >9 的分割之后的数组十位数
        for (var h = 0; h < arrJiShu2.length; h++) {
            jishu_child1.push(parseInt(arrJiShu2[h]) % 10);
            jishu_child2.push(parseInt(arrJiShu2[h]) / 10);
        }
        var sumJiShu = 0; // 奇数位*2 < 9 的数组之和
        var sumOuShu = 0; // 偶数位数组之和
        var sumJiShuChild1 = 0; // 奇数位*2 >9 的分割之后的数组个位数之和
        var sumJiShuChild2 = 0; // 奇数位*2 >9 的分割之后的数组十位数之和
        var sumTotal = 0;
        for (var m = 0; m < arrJiShu.length; m++) {
            sumJiShu = sumJiShu + parseInt(arrJiShu[m]);
        }
        for (var n = 0; n < arrOuShu.length; n++) {
            sumOuShu = sumOuShu + parseInt(arrOuShu[n]);
        }
        for (var p = 0; p < jishu_child1.length; p++) {
            sumJiShuChild1 = sumJiShuChild1 + parseInt(jishu_child1[p]);
            sumJiShuChild2 = sumJiShuChild2 + parseInt(jishu_child2[p]);
        }
        // 计算总和
        sumTotal = parseInt(sumJiShu) + parseInt(sumOuShu)
            + parseInt(sumJiShuChild1) + parseInt(sumJiShuChild2);
        // 计算luhn值
        var k = parseInt(sumTotal) % 10 == 0 ? 10 : parseInt(sumTotal) % 10;
        var luhn = 10 - k;
        if (lastNum == luhn) {
            return true;
        } else {
            return false;
        }
    },
    /**
     * 银行卡四要素验证
     * @description 目前接口:https://market.cloud.tencent.com/products/28149
     * @param {String} name 姓名
     * @param {String} phone 手机号
     * @param {String} idcard 身份证号
     * @param {String} bankno 银行卡号
     * @returns true/false
     */
    async BankNameCard(name, phone, idcard, bankno) {
        if (constant.StartModel.DEBUG == process.env.NODE_ENV) {
            /**
             *  开发阶段 直接返回验证成功
             */
            return new Promise((resolve, reject) => {
                resolve(true);
            })
        }

        /**
         * 调用API验证
         */
        let res = await http.post('http://service-5e8t6dqh-1305308687.sh.apigw.tencentcs.com/release/bankcard/4-validate', {
            bankCardNo: bankno,
            idCardNo: idcard,
            mobile: phone,
            name: name
        });
        if (res.data.code != 200) {
            return new Promise((resolve, reject) => {
                resolve(false);
            })
            return false;
        }
        if (res.data.data.result != 0) {
            return new Promise((resolve, reject) => {
                resolve(false);
            })
            return false;
        }
        return new Promise((resolve, reject) => {
            resolve(true);
        })
    }
}