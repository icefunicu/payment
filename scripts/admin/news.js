/**
 * 文章管理与发布
 */
const router = require(`express`).Router(); 
const mongo = require('../../config/database');
const _lodash = require('lodash');
/**
 * 文章管理[√]
 */
router.all('/manages',async (req, res) => {
    if (req.method == 'GET') { 
        res.render('admin/news_manage')
    } else {
        if ('remove' == req.body['type']) {
            await mongo.Coll('news').remove({_id:mongo.ObjectId(req.body['did'])});
            res.json({ message: '删除成功', success: true });
            return
        }
        let query = {}
        if (req.body['title']) {
            query['title'] = { $regex: req.body['title'] }
        }
        mongo.Coll('news').find(query, { html: 0 }).sort({ 'add': mongo.SORT_DESC }).skip((parseInt(req.body.pageIndex) - 1) * parseInt(req.body.pageSize)).limit(parseInt(req.body.pageSize), (err, docs) => {
            let ids = []
            _lodash(docs).forEach(val => {
                if (val['user']) {
                    ids.push(mongo.ObjectId(val['user']))
                }
            })
            mongo.Coll('member').find({ _id: { $in: ids } }, { 'mbr-name': 1 }, async (err, us) => {
                _lodash(docs).forEach(a => {
                    _lodash(us).forEach(b => {
                        if (a['user'] == b._id.toString()) {
                            a['user'] = b['mbr-name']
                        }
                    })
                })
                res.json({
                    datas: docs,
                    success: true,
                    total: await mongo.Coll('news').count(query)
                })
            })

        })
    }
})
/**
 * 发布文章[√]
 */
router.all('/append', async (req, res) => {
    if (req.method == 'GET') {
        mongo.Coll('member').find({}, { 'mbr-name': 1 }).sort({ _id: mongo.SORT_DESC }, async (err, docs) => {
            res.render('admin/news_append', {
                query: req.query,
                users: docs,
                data: await mongo.Coll('news').findOne({ _id: mongo.ObjectId(req.query.did) })
            })
        })
    } else {
        if (!req.body['title']) {
            res.json({ message: '请填写标题' })
            return
        }
        if (!req.body['html']) {
            res.json({ message: '请攥写文章内容' })
            return
        }
        if (req.body['type'] == '私信') {
            req.body['user'] = req.body['user']
        } else {
            delete req.body['user'];
        }
        delete req.body['_r'];
        delete req.body['data_edit'];
        await mongo.Coll('news').updateOne(
            { _id: mongo.ObjectId(req.body['data-id']) },
            {
                $set: req.body,
                $setOnInsert: { add: new Date(), author: res.app.locals.user['nickname'] },
            }, { upsert: true }
        )
        res.json({ message: '发布成功', success: true })
    }
})

module.exports = router;