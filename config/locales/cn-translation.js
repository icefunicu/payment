/**
 * 翻译简体中文到其他语言
 */

var args = process.argv.slice(2);
if (args.length != 1) {
    console.log('请指定目标语言! 命令后加语言参数')
    return
}
var lang = args[0];

const _tool = require('../../utils/tool');
const http = require('../../utils/http');
const zhCN = _tool.getJSON('./pc-zh.json');

var aa = { name: '123', obj: ['天', '月', '年'] };

/**
 * 翻译字符串
 * @param {string} str 需要翻译的字符串
 * @returns 翻译后的字符串
 */
async function Translation(str) {
    // 可正常使用

    //return str;


    let appid = '20220720001277926';
    let salt = 456;
    let pwd = 'KYynp9IdI2pxNbNrmmKW';
    let sign = _tool.md5(appid + str + salt + pwd);
    let res = await http.post('https://fanyi-api.baidu.com/api/trans/vip/translate', _tool.stringify({
        from: 'zh',
        q: str,
        to: lang,
        appid,
        salt,
        sign
    }));

    if (!res.data.error_code) {
        return res.data.trans_result[0].dst;
    }
    console.log('翻译失败:', res.data.error_code);
    return str;
}


function getChild(obj) {
    Object.keys(obj).forEach(key => {
        if(Array.isArray(obj[key])){

        }
        if (typeof zhCN[key] == 'string') {

        } else if (typeof zhCN[key] == 'object') {

        } else if (typeof zhCN[key] == 'number') {

        }
    })
}

// getChild(zhCN);
console.log(aa.obj.join('$$$'));
Translation('长者对男孩或年轻男子的称呼').then(res=>{
    console.log(res);
})


Object.keys(aa).forEach(key => {
    
    console.log(typeof aa[key])
})

