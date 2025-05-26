/**
 * 文件资源管理器
 */
const router = require(`express`).Router();
const constant = require('../../config/constant');
const tool = require('../../utils/tool');
const mongo = require('../../config/database');
const path = require('path');
// 上传文件相关
const fType = require('file-type');


const multer = require('multer');
const upload = multer({
    dest: constant.TEMP_DIR,
    fileFilter: (req, file, callback) => {
        callback(null, true);
    },
    limits: {
        /** 每个表单字段名的最大大小. (Default: 100) */
        fieldNameSize: undefined,
        /** 每个表单字段值的最大大小. (Default: 1048576) */
        fieldSize: undefined,
        /** 非文件表单字段的最大数目. (Default: Infinity) */
        fields: undefined,
        /** 每个文件的最大大小. (Default: Infinity) */
        fileSize: undefined,
        /**文件字段的最大数目. (Default: Infinity) */
        files: undefined,
        /**最大表单字段数量 (非文件 + 文件). (Default: Infinity) */
        parts: undefined,
        /** 最大报头数. (Default: 2000) */
        headerPairs: undefined
    },
    /** 保留原始文件名的完整路径，而不是基本名. (Default: false) */
    preservePath: false
});
const fs = require('fs');
fs.mkdir(constant.FILE_STORE, () => { })
//制作缩略图 
const Jimp = require('jimp');
const _mini_ext = '_mini.png';

/**
 * 隐藏文件真实地址 输出对应文件数据[√]
 */
router.get('/:key', async (req, res) => {

    let doc = await mongo.Coll(constant.RESOURCES_STORE).findOne({ file_key: req.params.key });
    if (doc) {
        res.setHeader("content-type", doc.mimetype);
        if (!doc.isImage) {
            res.setHeader("Content-Disposition", "attachment;filename=" + encodeURI(doc.originalname));
        }
        res.sendFile(path.resolve(doc.path));
    } else {
        res.send('');
    }

})
/**
 * 缩略图[√]
 */
router.get('/thumbnail/:key', async (req, res) => {
    let doc = await mongo.Coll(constant.RESOURCES_STORE).findOne({ file_key: req.params.key });
    if (doc) {
        res.setHeader("content-type", doc.mimetype);
        if (!doc.isImage) {
            res.setHeader("Content-Disposition", "attachment;filename=" + encodeURI(doc.originalname));
        }

        res.sendFile(path.resolve(doc.path + _mini_ext));
    } else {
        res.send('');
    }

})

/**
 * 上传文件[√]
 */
router.post("/file-upload", upload.array(constant.FILE_UPLOAD_FIELDNAME), async (req, res) => {
    /**
     * 设置文件属性
     * @param {object} file 上传的文件
     */
    function set_file_field(file) {
        let fName = tool.random(4, 27);
        let names = file.originalname.split('.');
        let ext = names[names.length - 1];
        fName = fName + '.' + ext;
        let des_file = path.join(constant.FILE_STORE, tool.dateFormat(new Date(), 'yyyyMMdd'))
        fs.mkdir(des_file, () => { })
        //设置文件属性
        file.file_key = tool.md5(des_file + '888' + fName);
        file.ioName = fName;
        let ioPath = path.join(des_file, fName);
        //复制文件到正确的位置
        fs.copyFileSync(file.path, ioPath);

        file.path = ioPath;

        file.isImage = (file.mime && file.mime.mime.startsWith('image'));

        file.type = "FILE";

        file.icon = getIcon(file.mimetype);

        file.url = '/assets/' + file.file_key;

        file.createTime = new Date();
    }
    /**
     * 设置文件ICON
     * @param {string} type 文件类型
     * @returns 
     */
    function getIcon(type) {
        switch (type) {
            case 'apk':
            case 'application/vnd.android.package-archive':
                return '';
            case "txt":
            case 'text/xml':
            case "text/plain":
                return "file alternate outline";
            case "zip|rar":
            case 'application/x-zip-compressed':
                return "file archive outline";
            case "mp3":
            case 'audio/mpeg':
                return "file audio outline";
            case "mp4":
                return "file video outline";
            case "doc":
                return "file word outline";
            // excel
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case "application/vnd.ms-excel":
                return "file excel outline";
            case "pdf":
                return "file pdf outline";
            case "ppt":
                return "file powerpoint outline";
            case "js|cs|cpp":
            case 'text/javascript':
                return "file code outline";
            default:
                return "file outline";

        }
    }
    
    //经过处理的文件
    let proced_files = []

    //循环读取上传的文件
    req.files.forEach(async (file, index) => {
        //读取文件实际类型
        file.mime = await fType.fromFile(file.path);
        console.log('处理:', file)
        //抛弃不允许上传的文件
        if (file.mime && constant.ABANDON_FILE_EXTS.includes(file.mime.ext)) {
            console.error(`已设置 ${file.mime.ext} 类型文件不上传到服务器; ${file.originalname} 未上传!`);
            proced_files.push({
                error: true,
                message: res.__mf('file-manage.upload.abandon', file.originalname)
            });
        } else {
            console.log(`开始上传:${file.originalname}`);
            //设置文件属性
            set_file_field(file);
            //设置虚拟路径
            file.virtual_path = req.body.virtual;
            console.log('处理完成:', file)
            //如果是图片 设置缩略图
            if (file.isImage) {
                try {
                    let io_path = path.resolve(file.path);

                    let img = await Jimp.read(io_path);
                    img.resize(120, 120).write(io_path + _mini_ext);

                    file.thumbnail = '/assets/thumbnail/' + file.file_key;
                } catch (ex) {
                    file.thumbnail = '/images/none.png';
                    console.error(`生产缩略图错误:${ex} ===> ${file.originalname}`);
                }
            }
            //保存文件到数据库
            let doc = await mongo.Coll(constant.RESOURCES_STORE).save(file);
            //处理完成的文件
            proced_files.push(doc);
        }

        //全部处理完成后:
        if (index === req.files.length - 1) {
            /*** 输出结果到前台 ***/
            res.json({ success: true, files: proced_files });
        }
    })
})

/**
 * 建立文件夹[√]
 */
router.post('/file-new-folder', async (req, res, next) => {
    if (!req.body.cur) {
        req.body.cur = '/'
    }
    let path = req.body.cur + req.body.folder + '/';
    await mongo.Coll(constant.RESOURCES_STORE).updateOne(
        { path: path },
        {
            $set: {
                type: "FOLDER",
                path: path,
                parent: req.body.cur,
                originalname: req.body.folder,
                createTime: new Date()
            }
        },
        { upsert: true }
    )
    res.json({ success: true })
})

/**
 * 文件管理[√]
 */
router.post("/file-manage", async (req, res, next) => {
    let dir_path = ''
    if (req.body.parent != '/') {
        dir_path = path.dirname(req.body.parent) + '/'
    }
    if (dir_path == '//') {
        dir_path = '/'
    }

    mongo.Coll(constant.RESOURCES_STORE).find(
        {
            $or: [
                { parent: req.body.parent },
                { virtual_path: req.body.parent }
            ]
        }
        , { path: 1, parent: 1, file_key: 1, thumbnail: 1, originalname: 1, createTime: 1, url: 1, isImage: 1, icon: 1, size: 1, _id: 0, type: 1 })
        .sort({ type: -1, createTime: mongo.SORT_DESC }, (err, doc) => {
            res.json({
                path: req.body.parent, // 文件夹重命名后 路径显示有问题 [前台处理]
                parent: dir_path,
                files: doc
            })
        })

})
/**
 * 处理请求[√]
 */
router.post('/command', async (req, res) => {
    //重命名
    if (req.body.type == 'rename') {
        let query = { file_key: req.body.key }
        if (req.body.fileType == 'FOLDER') {
            query = { originalname: req.body.originalname, path: req.body.path, type: 'FOLDER' }
        }
        await mongo.Coll(constant.RESOURCES_STORE).updateOne(
            query,
            {
                $set: {
                    originalname: req.body.new_name
                }
            },
            { upsert: false }
        )
        res.json({ success: true })
    }
    //删除
    if (req.body.type == 'remove') {
        if (req.body.fileType == 'FOLDER') {
            res.json({ message: res.__('file-manage.drop-dir-forbid') })
            return;
        }
        let doc = await mongo.Coll(constant.RESOURCES_STORE).remove({ file_key: req.body.key });
        if (doc) {
            try {
                let io_path = path.resolve(doc.path);
                fs.unlinkSync(io_path)
                if (doc.isImage) {
                    fs.unlinkSync(io_path + _mini_ext)
                }
            } catch (e) {

            }
        }
        res.json({ success: true })

    }
})
/**
 * i18n
 */
router.post("/file-manage-language", (req, res, next) => {
    res.json({
        title: res.__('file-manage.title'),
        no_file: res.__mf('file-manage.no-files', res.__('file-manage.no-files-text')),
        contextmenus: {
            file: {
                download: res.__('file-manage.contextmenu.download'),
                preview: res.__('file-manage.contextmenu.preview'),
                rename: res.__('file-manage.contextmenu.rename'),
                remove: res.__('file-manage.contextmenu.remove'),
                more: res.__('file-manage.contextmenu.more'),
                copy: res.__('file-manage.contextmenu.copy'),
                paste: res.__('file-manage.contextmenu.paste'),
                cut: res.__('file-manage.contextmenu.cut'),
                replace: res.__('file-manage.contextmenu.replace'),
                attribute: res.__('file-manage.contextmenu.attribute'),
                folder: res.__('file-manage.contextmenu.folder'),
                "new-folder": res.__('file-manage.create-folder'),
                "remove-confirm": res.__('file-manage.contextmenu.remove-confirm')
            },
            manage: {
                "upload": res.__('file-manage.contextmenu.upload'),
                "image": res.__('file-manage.contextmenu.image'),
                "folder": res.__('file-manage.contextmenu.folder'),
                "refresh": res.__('file-manage.contextmenu.refresh'),
            }
        }
    })
})



module.exports = router;