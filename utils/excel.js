const excel = require('node-xlsx');
/**
 * Excel 导入导出
 */
module.exports = {
    /**
     * 导入EXCEL数据
     * @param {String|Stream} mixed 文件地址 或 数据流
     */
    import(mixed) {
        return new Promise((resolve, reject) => {
            try {
                var xls = excel.parse(mixed, {})
                resolve(xls);
            } catch (e3) {
                reject(e3);
            }
        })
    },
    /**
     * 导出excel
     * @param {*} worksheets { name: '工作表名称', data: [['账户','密码','生日'],['aaa', 'qqq2','2024-9-8']] }
     */
    export(worksheets) {
        return new Promise((resolve, reject) => {
            try {
                var buffer = excel.build(worksheets)
                resolve(buffer)
            } catch (e3) {
                reject(e3)
            }
        })

    }
}