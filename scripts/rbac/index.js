/**
 * 权限模块
 */

const router = require(`express`).Router();
const mongo = require('../../config/database');
const fs = require('fs');
const path = require('path');

const collection_role = 'rbac_role';
const collection_admin = 'rbac_user';
/**
 * 角色管理
 */
router.get('/role', (req, res) => {
    res.render('shared/rbac/role')
})
/**
 * 角色数据
 */
router.post('/role', async (req, res) => {
    let count = await mongo.Coll(collection_role).count();
    mongo.Coll(collection_role).find({}).sort({ '_id': mongo.SORT_DESC }, (err, cols) => {
        res.json({
            success: true,
            message: '无法加载指定数据',
            datas: cols,
            total: count,
        })
    });
})
/**
 * 新建角色
 */
router.all('/role-edit', async (req, res) => {
    if (req.method == 'GET') {
        mongo.Coll(collection_role).find({}, (err, cols) => {
            let data = {}
            if (req.query.type == 'edit') {
                data = cols.find((val) => {
                    return val._id == req.query.did
                });
            }
            res.render('shared/rbac/role_add_edit', { roles: cols, data: data });
            return;
        });

    }
    if (req.method == 'POST') {
        delete req.body._r;
        let _id = mongo.ObjectId(req.body['data_id']);
        req.body['role-used'] = req.body['role-used'] == 'on'
        delete req.body.data_id
        let updated = await mongo.Coll(collection_role).updateOne(
            { _id: _id },
            { $set: req.body },
            { upsert: true });
        res.json({
            success: updated,
            message: res.__('feedback.modify-success'),
        })
    }
})

/**
 * 管理员
 */
router.all('/users', async (req, res) => {
    if (req.method == 'GET') {
        res.render('shared/rbac/users')
    }
    if (req.method == 'POST') {

        let query = {};

        let total = await mongo.Coll(collection_admin).count(query);
        mongo.Coll(collection_admin).find(query, { 'user-password': 0, 'user-edit-password': 0 }).skip(0).limit(10).sort({ _id: mongo.SORT_DESC }, (err, docs) => {
            //# 属于哪个角色 S
            mongo.Coll(collection_role).find({}, (q, rols) => {
                docs.forEach(val => {
                    val['user-part'] = [];
                    if (val['roles']) {
                        if (typeof val['roles'] == 'string') {
                            val['roles'] = [val['roles']];
                        }
                        val['roles'].forEach(r => {
                            rols.forEach((value) => {
                                if (r == value._id.toString()) {
                                    val['user-part'].push(value['role-name'])
                                }
                            })
                        })
                    }
                })
                //# 属于哪个角色  E 
                res.json({
                    success: true,
                    datas: docs,
                    total: total
                })
                //# 属于哪个角色 E
            })
        })
    }
})
/**
 * 新增或编辑用户
 */
router.all('/users-edit', async (req, res) => {
    if (req.method == 'GET') {

        let data = null;
        if (req.query.type == 'edit') {
            data = await mongo.Coll(collection_admin).findOne({ _id: mongo.ObjectId(req.query.did) });
            if (typeof data['roles'] == 'string') {
                data['roles'] = [data['roles']];
            }
        }
        mongo.Coll(collection_role).find({}, (err, cols) => {
            res.render('shared/rbac/users_add_edit', { roles: cols, data: data })
        });
    }
    if (req.method == 'POST') {

        let results = await mongo.Coll(collection_admin).updateOne(
            {
                _id: mongo.ObjectId(req.body['data_id'])
            },
            {
                $set: {
                    'user-text': req.body['user-text'],
                    'user-name': req.body['user-name'],
                    'user-password': req.body['user-password'],
                    'user-desc': req.body['user-desc'],

                    'user-edit-password': (req.body['user-edit-password'] == 'on'),
                    'user-alway-password': (req.body['user-alway-password'] == 'on'),
                    'user-used': (req.body['user-used'] == 'on'),

                    'roles': req.body['user-role']
                }
            },
            { upsert: true }
        )
        res.json({ message: res.__('feedback.modify-success'), success: true })
    }

})

/**
 * 权限配置
 */
router.get('/role-auth', async (req, res) => {
    let role = await mongo.Coll(collection_role).findOne({ _id: mongo.ObjectId(req.query.did) });
    const files = fs.readdirSync('./config/authority/');
    let auths = []
    for (f of files) {
        let jon = JSON.parse(fs.readFileSync(path.join('./config/authority/', f), 'utf-8'));
        auths.push(jon);
    }
    res.render('shared/rbac/role-auth', { auths: auths, role: role })
})
/**
 * 保存权限设置
 */
router.post('/role-auth', async (req, res) => {
    await mongo.Coll(collection_role).updateOne({
        _id: mongo.ObjectId(req.query.did)
    }, {
        $set: { auths: req.body['auth-list'] }
    },
        { upsert: false });
    res.json({ success: true, message: '完成' })
})


module.exports = router;