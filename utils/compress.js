/**
 * 压缩 解压缩
 * 
 * npm i jszip
 * npm i fs
 * npm i path
 */

var jsZIP = require('jszip');
var fs = require('fs')
var sys_path = require('path');
var _tool = require('./tool')
const constant = require('../config/constant')


/**
 * 获取文件夹下全部文件 递归子文件夹
 * @param {string} dir 根目录
 * @param {string} exclude 排除的文件夹名称
 * @returns 
 */
function get_files(dir, exclude) {
    exclude = exclude || []
    return new Promise((resolve, reject) => {
        try {
            var dirs = fs.readdirSync(dir)
            var paths = []
            dirs.forEach(ele => {
                if (exclude.indexOf(ele) == -1) {
                    var cur_path = (sys_path.join(dir, ele))
                    var stat = fs.statSync(cur_path)
                    if (stat.isFile()) {
                        paths.push({
                            name: cur_path,
                            content: fs.readFileSync(cur_path)
                        })
                    } else {
                        get_files(cur_path, exclude).then(p2 => {
                            paths.push.apply(paths, p2);
                        })
                    }
                }
            })
            resolve(paths)
        } catch (e2) {
            reject(e2)
        }
    })
}



module.exports = {
    /**
     * 备份网站
     * @param {list} exclude 排除的文件夹
     * @returns 
     */
    Backup(exclude) {
        return new Promise((resolve, reject) => {
            try {
                get_files('.', exclude).then(paths => {
                    var zip = new jsZIP()
                    paths.forEach(ele => {
                        /** 增加文件 **/
                        zip.file(ele.name, ele.content,
                            {
                                dir: false,
                                createFolders: false
                            });
                    })
                    /*** 压缩 ****/
                    zip.generateAsync({
                        type: "nodebuffer",
                        compression: 'DEFLATE',
                        compressionOptions: {
                            level: 9
                        }
                    }).then(function (content) {
                        /** 保存文件 **/
                        let out_dir = constant.BACKUP_FILE_DIR;//  './backups'
                        if (!fs.statSync(out_dir, { throwIfNoEntry: false })) {
                            fs.mkdirSync(out_dir);
                        }
                        let out_file = sys_path.join(out_dir, 'site_' + _tool.dateFormat(new Date(), 'yyyy-MM-dd_hh_mm_ss') + _tool.random(2, 10000) + '.back')
                        fs.writeFileSync(out_file, content);
                        resolve(out_file)

                    }).catch(e4 => {
                        reject(e4)
                    });
                })
            } catch (e3) {
                reject(e3)
            }
        })
    },
    /**
     * 压缩一个文件夹
     * @param {string} dir_path 需要压缩的文件夹
     * @param {string} out_file 输出文件
     * @returns 
     */
    Dir(dir_path, out_file) {
        return new Promise((resolve, reject) => {
            get_files(dir_path).then(paths => {
                var zip = new jsZIP()
                paths.forEach(ele => {
                    /** 增加文件 **/
                    zip.file(ele.name, ele.content,
                        {
                            dir: false,
                            createFolders: false
                        });
                })
                /*** 压缩 ****/
                zip.generateAsync({
                    type: "nodebuffer",
                    compression: 'DEFLATE',
                    compressionOptions: {
                        level: 9
                    }
                }).then(function (content) {
                    /** 保存文件 **/
                    fs.writeFileSync(out_file, content);
                    resolve(sys_path.resolve(out_file))

                }).catch(e4 => {
                    reject(e4)
                });

            }).catch(e3 => {
                reject(e3)
            })

        })
    },
    /**
     * 压缩单个文件
     * @param {string} path 文件
     * @param {string} out_file 输出文件
     * @returns 
     */
    File(path, out_file) {
        return new Promise((resolve, reject) => {
            var zip = new jsZIP();
            var content = fs.readFileSync(path)
            var name = sys_path.basename(path)
            zip.file(name, content,
                {
                    dir: false,
                    createFolders: false
                });
            /*** 压缩 ****/
            zip.generateAsync({
                type: "nodebuffer",
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9
                }
            }).then(function (content) {
                /** 保存文件 **/
                fs.writeFileSync(out_file, content);
                resolve(sys_path.resolve(out_file))
            }).catch(e4 => {
                reject(e4)
            });
        })
    },
    /**
     * 解压缩文件
     * @param {string} zip_file 压缩文件
     * @param {string} out_dir  输出目录
     * @returns 
     */
    UnZip(zip_file, out_dir) {
        out_dir = out_dir || ''
        out_dir = sys_path.resolve(out_dir)
        if (!fs.statSync(out_dir, { throwIfNoEntry: false })) {
            fs.mkdirSync(out_dir);
        }
        return new Promise((resolve, reject) => {
            if (!fs.statSync(zip_file, { throwIfNoEntry: false })) {
                reject(new Error(`文件不存在:${zip_file}`))
                return
            }

            var new_zip = new jsZIP();
            new_zip.loadAsync(fs.readFileSync(zip_file)).then(zFiles => {
                if (zFiles) {
                    let current = 0;
                    zFiles.forEach((name, entry) => {
                        var save_file = sys_path.join(out_dir, entry.name);
                        var new_dir = sys_path.dirname(save_file);
                        if (!fs.statSync(new_dir, { throwIfNoEntry: false })) {
                            fs.mkdirSync(new_dir);
                        }
                        entry.nodeStream('nodebuffer')
                            .pipe(fs.createWriteStream(save_file))
                            .on('finish', () => {
                                current = current + 1;
                                if (Object.keys(zFiles.files).length == current) {
                                    resolve(out_dir)
                                }
                            })
                            .on('error', err => {
                                reject(err)
                            })
                    })
                } else {
                    reject({})
                }
            }).catch(e1 => {
                reject(e1)
            })
        })
    }

}

