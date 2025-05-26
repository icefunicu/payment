/**
 * 接口轮换 规则
 * 
 * 生产出最终可以使用的渠道
 */

const mongo = require('../../../config/database');
const _lodash = require('lodash');

module.exports = {

    /**
     * 生产渠道
     * @param {string} raType 轮换模式
     * @param {object} gateway 渠道
     * @param {money} trade_money 交易金额
     * @returns 产出渠道
     */
    async rotation(raType, gateway,trade_money) {
        let channelTemp = undefined;
        let gcs = gateway['channel-gateways'];


        switch (raType) {
            case 'loop'://顺序轮换 [√]
                console.log('顺序轮换:');
                let _lopIndex = parseInt(gateway['loopIndex']);
                if (isNaN(_lopIndex)) {
                    _lopIndex = 0;
                }
                if (_lopIndex >= gcs.length) {//达到最大次数后 从 1 开始
                    _lopIndex = 0;
                }
                _lopIndex = _lopIndex + 1;
                _lodash(gcs).forEach(async val => {
                    let cIndex = parseInt(val['loopIndex']);
                    if (cIndex == _lopIndex) {
                        channelTemp = val;
                        await mongo.Coll('gateway').updateOne({ _id: gateway._id }, { $set: { loopIndex: _lopIndex } }, { upsert: false });
                        console.log('顺序轮换', _lopIndex)
                    }
                });
                break;
            case 'random'://随机 [√] 
                var rand = (Math.random() * gcs.length) | 0;
                channelTemp = gcs[rand];
                console.log('随机轮换', channelTemp);
                break;
            case 'timing'://定时 [√]
                console.log('定时轮换:');
                let nowDate = new Date(2000, 1, 1, new Date().getHours(), new Date().getMinutes(), 0);
                _lodash(gcs).forEach(async val => {
                    let timeStart = val['timing'].timeStart.split(':');
                    let timeEnd = val['timing'].timeEnd.split(':');
                    let start_time = new Date(2000, 1, 1, timeStart[0], timeStart[1], 0);
                    let end_time = new Date(2000, 1, 1, timeEnd[0], timeEnd[1], 0);
                    if (nowDate >= start_time && nowDate < end_time) {
                        channelTemp = val;
                        console.log('定时 接口:', channelTemp);
                    }
                });
                break;
            case 'onemoney'://单笔额度[√]
                console.log('单笔额度:');
                _lodash(gcs).forEach(async val => {
                    let oneMoney = val['oneMoney'];
                    if (trade_money >= parseFloat(oneMoney.oneMini) && trade_money < parseFloat(oneMoney.oneMax)) {
                        channelTemp = val;
                        console.log('单笔额度 接口:', channelTemp);
                    }
                });
                break;
            case 'maxcount'://满笔[√]
                console.log('满笔 轮换:');
                let _fullCount = gateway['fullCount'] || { count: 0, index: 1 };
                if (_fullCount.index >= gcs.length) {//达到最大次数后 从 1 开始
                    _fullCount.index = 1;
                }
                channelTemp = _lodash.find(gcs, val => {
                    return _fullCount.index == val['fullCount'].countMini && _fullCount.count <= parseInt(val['fullCount']['countMax'])
                })
                if (!channelTemp) {//移动到下一个
                    _fullCount.index = _fullCount.index + 1;
                    _fullCount.count = 0;
                    channelTemp = _lodash.find(gcs, val => {
                        return val['fullCount'].countMini == _fullCount.index;
                    });
                }
                if (!channelTemp) {//回到最开始 1号 接口
                    _fullCount.index = 1;
                    _fullCount.count = 0;
                    channelTemp = _lodash.find(gcs, val => {
                        return val['fullCount'].countMini == _fullCount.index;
                    });
                }
                if (channelTemp) {
                    await mongo.Coll('gateway').updateOne({ _id: gateway._id }, { $set: { fullCount: { count: _fullCount.count + 1, index: _fullCount.index } } }, { upsert: false });
                    console.log('满笔轮换', channelTemp)
                }
                break;
            case 'fulfil'://满额[√]
                console.log('满额 轮换:'); 
                let _fullMoney = gateway['fullMoney'] || { total: 0, index: 1 };
                if (_fullMoney.index >= gcs.length) {//达到最大次数后 从 1 开始
                    _fullMoney.index = 1;
                }
                channelTemp = _lodash.find(gcs, val => {
                    return _fullMoney.index == val['fullMoney'].moneyMini && _fullMoney.total <= parseInt(val['fullMoney']['moneyMax'])
                })
                if (!channelTemp) {//移动到下一个
                    _fullMoney.index = _fullMoney.index + 1;
                    _fullMoney.total = 0;
                    channelTemp = _lodash.find(gcs, val => {
                        return val['fullMoney'].moneyMini == _fullMoney.index;
                    });
                }
                if (!channelTemp) {//回到最开始 1号 接口
                    _fullMoney.index = 1;
                    _fullMoney.total = 0;
                    channelTemp = _lodash.find(gcs, val => {
                        return val['fullMoney'].moneyMini == _fullMoney.index;
                    });
                }
                if (channelTemp) {
                    await mongo.Coll('gateway').updateOne({ _id: gateway._id }, { $set: { fullMoney: { total: _fullMoney.total + trade_money, index: _fullMoney.index } } }, { upsert: false });
                    console.log('满额 轮换', channelTemp)
                }
                break;
            //默认情况与不轮换模式时,直接使用默认渠道
        }
        if (!channelTemp) {
            //默认渠道
            channelTemp = gateway['channel-default'];
        }
        return channelTemp;
    }
}