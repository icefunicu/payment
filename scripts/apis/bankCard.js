/**
 * 银行卡相关
 */

const http = require('../../utils/http');
const bankName = require('./bankNames')

module.exports = {
 
    /**
     * 获取银行卡所属银行 (需要联网)
     * @param {string} cardNo 银行卡号
     * @returns 
     */
    async CardBelong(cardNo) {
        let res = await http.get('https://ccdcapi.alipay.com/validateAndCacheCardInfo.json', {
            params: { cardNo: cardNo, cardBinCheck: 'true' }
        }
        )
        if (res.data.validated) {
            return {
                success: true,
                type: bankName.getType(res.data.cardType),
                name: bankName.getName(res.data.bank),
                card: cardNo,
                code: res.data.bank
            }
        } else {
            return {
                success: false,
                card: cardNo,
                message: res.data.messages[0]
            }
        }

    }
}


