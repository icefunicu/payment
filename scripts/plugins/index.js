/**
 * 插件系统
 * [插件的管理与调度]
 */

const router = require(`express`).Router();
const mongo = require('../../config/database');
const _zip = require('../../utils/compress');
const fs = require('fs');
const tool = require('../../utils/tool');
const path = require('path');
const _lodash = require('lodash');

/**
 * 验证插件是否符合规范[√]
 * @param {string} pulgPath 插件文件
 * @returns 
 */
function checkCode(pulgPath) {
    try {
        //删除缓存
        delete require.cache[pulgPath];
        let temp = require(pulgPath);
        if (typeof temp.Main == 'function'

            && typeof temp.Args == 'object'

            && typeof temp.Version == 'string'
            && typeof temp.Describe == 'string'
            && typeof temp.Name == 'string' &&
            temp.Version && temp.Name
        ) {
            //验证成功
            return temp;
        }
        return false;

    } catch (e) {
        return false;
    }
}
/**
 * 参数配置[√]
 */
router.all('/args', async (req, res) => {
    if (req.method == 'GET') {
        res.render('admin/plugins_args', { data: await mongo.Coll('plugins').findOne({ _id: mongo.ObjectId(req.query['did']) }) });
    } else {
        let doc = await mongo.Coll('plugins').findOne({ _id: mongo.ObjectId(req.query['did']) });

        _lodash(doc['Args']).forEach(val => {
            val.val = req.body[val.name];
        });

        await mongo.Coll('plugins').updateOne({ _id: doc._id }, {
            $set: doc
        }, { upsert: false });

        res.json({ success: true, message: '参数设置成功' });
    }
})
/**
 * 运行插件[√]
 */
router.all('/run', async (req, res) => {
    let data = await mongo.Coll('plugins').findOne({ _id: mongo.ObjectId(req.query['did']) });
    if (!data) {
        res.json({ message: '插件数据不存在' });
        return;
    }
    let pulgPath = path.resolve('./scripts/plugins/' + data.Name + '/index.js');
    if (!fs.existsSync(pulgPath)) {
        res.json({ message: '插件不包含入口文件' });
        return;
    }
    delete require.cache[pulgPath];
    let plugin = require(pulgPath);
    if (!plugin) {
        res.json({ message: '插件不存在' });
        return;
    }
    data.State = 'RUN';
    await mongo.Coll('plugins').updateOne({ _id: data._id },{
        $set:data
    },{upsert:false});

    plugin.Main(data.Args, req, res);
})
/**
 * 安装系统插件[√]
 */
router.all('/append', async (req, res) => {
    if (req.method == 'GET') {
        res.render('admin/plugins_append');
    } else {
        let zipFile = req.body['plugs'];//插件文件
        if (!fs.existsSync(zipFile)) {
            res.json({ message: '文件不存在' });
            return
        }
        let tmpDir = tool.TempDir();
        _zip.UnZip(zipFile, tmpDir).then(async dir => {
            let plug = checkCode(path.join(dir, 'index.js'));
            if (!plug) {//当前插件
                tool.TempDir(dir);
                res.json({ message: '插件不符合规范' });
                return;
            }
            let plugin = await mongo.Coll('plugins').findOne({ Name: plug.Name });//数据库中版本
            if (plugin) {//已经有该插件
                if (tool.VerCompare(plugin.Version, plug.Version) == -1) {
                    tool.TempDir(dir);
                    res.json({ message: '不能安装低版本' });
                    return;
                }
                if (tool.VerCompare(plugin.Version, plug.Version) == 0) {
                    tool.TempDir(dir);
                    res.json({ message: '已存在相同版本' });
                    return;
                }
            }
            /**
             * 安装:
             */
            // 1) 复制物理文件至对应目录
            tool.CopyDir(dir, fs.mkdirSync(path.resolve('./scripts/plugins/' + plug.Name), { recursive: true }));
            // 2) 存在数据到数据库
            await mongo.Coll('plugins').save({
                Name: plug.Name,
                Version: plug.Version,
                Describe: plug.Describe,
                Args: plug.Args,
                Help: plug.Help,

                State: 'New',
                addTime: new Date()
            })
            // 3) 移除临时文件
            tool.TempDir(dir);
            res.json({ message: '插件安装成功', success: true })
        })

    }
})
/**
 * 插件管理[√]
 */
router.all('/', async (req, res) => {
    if (req.method == 'GET') {
        res.render('admin/plugins', {

        })
    } else {
        if (req.body['type'] == 'remove') {
            //删除物理文件
            let plug = await mongo.Coll('plugins').findOne({ _id: mongo.ObjectId(req.body['did']) });
            try {
                tool.TempDir(path.resolve('./scripts/plugins/' + plug.Name));
            } catch (e) {
                console.error(e)
            }
            //删除记录
            await mongo.Coll('plugins').remove({ _id: mongo.ObjectId(req.body['did']) });
            res.json({ success: true, message: '删除成功' });
            return
        }
        mongo.Coll('plugins').find({}).sort({ _id: mongo.SORT_DESC }, async (err, docs) => {
            res.json({
                success: true,
                datas: docs,
                total: await mongo.Coll('plugins').count({})
            })
        });
    }
})

module.exports = router