/* 生产 */
const QRCode = require('qr-image');
/* 识别 */
const qrcodeReader = require('qrcode-reader');
var Jimp = require("jimp");
var fs = require('fs')
/**
 * 二维码
 */
module.exports = {
    /**
     * 二维码 编码
     * @param {*} data 
     * @param {*} res 
     */
    encode(data, response, opt) {
        opt = opt || {
            size: 8,
            margin: 1,
            ec_level: 'M'
        }
        var code = QRCode.image(data,
            {
                type: 'png',                    //png(默认)，svg, pdf 和 eps。
                size: opt.size,                 //模块的像素大小
                margin: opt.margin,             //QR图像周围的空白
                ec_level: opt.ec_level,         //L, M, Q, H. Default M
            });
        response.writeHead(200, { 'Content-Type': 'image/png;charset=UTF-8' });
        code.pipe(response);
    },
    /**
     * 二维码 识别
     * @param {*} path 
     * @returns 
     */
    decode(path) {
        return new Promise((resolve, reject) => {
            try {
                var buffer = fs.readFileSync(path);
                Jimp.read(buffer, (err, image) => {
                    if (err) {
                        console.error(err);
                        reject(err)
                    }
                    var qr = new qrcodeReader();
                    qr.callback = (err, value) => {
                        if (err) {
                            console.error(err);
                            reject(err)
                        }
                        resolve(value)
                    };
                    qr.decode(image.bitmap);
                });
            } catch (e2) {
                reject(e2)
            }
        })
    }
}