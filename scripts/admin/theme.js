/**
 * 文章管理与发布
 */
const router = require(`express`).Router();
const _lodash = require('lodash');
const fs = require('fs');
const tool = require('../../utils/tool');
const path = require('path');
/**
 * 模板管理[√]
 */
router.all('/', async (req, res) => {
    if (req.method == 'GET') {
        let themes = [];
        _lodash(fs.readdirSync('./views/themes')).forEach(val => {
            try {
                let jon = tool.getJSON(`./views/themes/${val}/setting.cfg`);
                if (Object.keys(jon).length > 0) {
                    jon['path'] = val;
                    themes.push(jon);
                }

            } catch (e) {

            }

        })
        res.render('admin/theme', {
            themes
        })
    } else {
        if ('remove' == req.body['type']) {
            fs.rmdirSync(`./views/themes/${req.body['theme']}`, { recursive: true })
            fs.rmdirSync(`./assets/themes/${req.body['theme']}`, { recursive: true })

            res.json({ message: '删除成功', success: true });
            return
        }
        if ('apply' == req.body['type']) {

            let theme = tool.getFile('./runtime/theme.cfg');
            if (!theme) {
                theme = 'default';
            }
            if (Object.keys(theme).length < 1) {
                theme = 'default';
            }
            //清理引入文件
            require.cache[require.resolve((`../../views/themes/${theme}`))];
            //写入模板
            fs.writeFileSync('./runtime/theme.cfg', req.body['theme']);
            res.json({ message: '切换成功', success: true });
            return
        }
        res.send('')
    }
})
/**
 * 模板文件编辑[√]
 */
router.all('/edit', async (req, res) => {
    if (req.method == 'GET') {
        res.render('admin/theme_edit', { files: fs.readdirSync(`./views/themes/${req.query['path']}`) })
    } else {
        if (req.body['type'] == 'read') {
            let content = fs.readFileSync((`./views/themes/${req.query['path']}/${req.body['path'].trim()}`), { encoding: 'utf-8' });
            res.json({ success: true, content });
            return;
        }
        if (req.body['type'] == 'write') {
            fs.writeFileSync(`./views/themes/${req.query['path']}/${req.body['path'].trim()}`, req.body['content']);
            res.json({ success: true, message: '文档保存成功' });
            return;
        }
        if (req.body['type'] == 'add') {
            try {
                let fPath = `./views/themes/${req.query['path']}/${req.body['path'].trim()}`;
                if (fs.existsSync(fPath)) {
                    res.json({ message: `${req.body['path']} 文件已存在` });
                    return
                }
                fs.writeFileSync(fPath, '');
                res.json({ success: true, message: `${req.body['path']} 创建成功` });
            } catch (e) {
                console.error(e);
                res.json({ message: e });
            }
            return;
        }
        if (req.body['type'] == 'remove') {
            fs.unlinkSync(path.resolve(`./views/themes/${req.query['path']}/${req.body['path'].trim()}`), true);
            res.json({ success: true, message: '文档 删除 成功' });
            return;
        }
        res.json({ message: '执行失败' })
    }
})



module.exports = router;