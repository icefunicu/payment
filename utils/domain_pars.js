/**
 * 域名自动解析
 */

const mongo = require('../config/database');
const http = require('./http');
const tool = require('./tool');


/**
 * 解析
 */
async function domain_parsing(token, domain, serverIP, coll) {
    let parm = {
        login_token: token,
        format: 'json',
        lang: 'cn',
        //--------------------------- 
        domain: domain,

        record_id: 0,
        sub_domain: '',
        record_type: '',
        record_line: '',
        value: '',
        mx: 0,
        ttl: 0,
        status: 'enable'
    }
    //查找本地记录 domain_record 时已经添加
    coll.find({ domain: domain }, function (err, docs) {
        docs.forEach(doc => {
            console.log('修改记录：', doc);
            parm.record_id = doc.record_id;
            parm.sub_domain = doc.name;
            parm.value = serverIP;//服务器IP
            parm.record_type = doc.type;
            parm.record_line = doc.line;
            parm.mx = doc.mx;
            parm.ttl = doc.ttl;

            http.request({
                url: 'https://dnsapi.cn/Record.Modify',
                method: 'post',
                data: tool.stringify(parm)
            }).then(async res => {
                if (res.data.status.code == 1) {
                    doc.value = serverIP;
                    await coll.save(doc);
                    console.log('修改记录成功并保存：', doc);
                } else {
                    console.log('修改记录成功：', doc);
                }
            });
        })
    });
}
/**
 * 判断域名是否解析到本服务器
 * @param {string} token login_token
 * @param {string} domains 多个域名
 */
async function domain_record(token, domains) {
    let serverIP = (await tool.getIp()).ip;
    var coll = mongo.Coll('domain_record');
    domains.forEach(async domain => {
        let count = await coll.count({ domain: domain, value: serverIP });
        if (count < 1) {//本地不存在记录 到服务器获取
            //本地记录不正确 清理
            let remove_res = await coll.remove({ domain: domain });
            console.log('清理旧记录：', remove_res);
            //---------------------
            let parm = {
                login_token: token,
                format: 'json',
                lang: 'cn',
                //--------------------------- 
                domain: domain
            }
            //调用API查询域名解析记录
            let res = await http.request({
                url: 'https://dnsapi.cn/Record.List',
                method: 'post',
                data: tool.stringify(parm)
            });
            if (res.data.status.code == 1) {//查询成功
                let rds = [];
                res.data.records.forEach(record => {
                    if (record.type != 'NS') {
                        rds.push({
                            domain: res.data.domain.name,
                            record_id: record.id,
                            value: record.value,
                            name: record.name,
                            line: record.line,
                            type: record.type,
                            mx: record.mx,
                            ttl: record.ttl
                        })
                    }
                });
                mongo.Coll('domain_record').save(rds);
            }
            //域名没有指向到本服务器 ，修复解析记录
            await domain_parsing(token, domain, serverIP, coll);
        } else {
            console.log('域名已正确指向到本服务器：',domain, serverIP);
        }
    });

}

/**
 * 
 */
module.exports = {
    /**
     * 域名解析
     */
    DoainPars: domain_record
}