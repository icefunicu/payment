# 四方平台支付系统

#### 介绍
支持多商户 多模板的三方支付 四方支付平台
支持聚合码支付 可集成微信支付、QQ支付、支付宝支付、京东支付、银联支付、PayPal支付等常用的支付

#### 关于系统的使用
被问及最多的问题就是，本系统是否可以免费使用，答案是可以。本系统完全开源完全免费，不收取任何费用，也不需要授权码，更不需要关注微信等公众号。
 **但是如果您需要我为您安装或者后期长期维护，则您需要支付一定费用。** 

### 联系我
- :fa-phone-square:  :one:  :five:  :nine:  :three:  :three:  :one:  :six:  :five:  :zero:  :zero:  :two: 
- :fa-qq: 2244110303
- :fa-envelope: chianmain@163.com  

### 系统文档
- [项目开发说明](/assets/documents/项目开发说明.doc)
- [接口制作说明](/assets/documents/接口制作说明.doc)
- [订单查询接口](/assets/documents/订单查询接口.doc)
- [API统一收单接口](/assets/documents/API统一收单接口(v2.4).doc)
### 各语言接入SDK
1. [php 接入 sdk](/assets/documents/php-sdk.zip)
2. [python 接入 sdk](/assets/documents/python-sdk.zip)

### 更新
- 2024-7-24: 
完成子账号功能 优化代码 修改BUG 增加订单实时监控功能
- 2024-2-3:
优化代码
- 2024-1-6:
添加接口测试页面 修正部分BUG
- 2023-8-5:
开发子账号功能
- 2023-7-30:
增加views文件夹,之前的项目不完整,现在已经完整可用
### 主要功能
1. 前台支持多模板切换
2. 支持多渠道
3. 支持多网关轮换 (定时 随机 漫笔 满额 等),可自定义参数配置
4. 支持单网关绑定多渠道
5. 支持多商户 支持代理 
6. 支持API代付出款
7. 接入文档完整,带有各语言接入示例 
8. 其他...


### 软件架构
nodejs mongoDB

### 部分功能截图
![订单管理](etc/%E7%A4%BA%E4%BE%8B%E5%9B%BE%E7%89%87/%E8%AE%A2%E5%8D%95%E7%AE%A1%E7%90%86.png)
![订单详情](etc/%E7%A4%BA%E4%BE%8B%E5%9B%BE%E7%89%87/%E8%AE%A2%E5%8D%95%E8%AF%A6%E6%83%85.png)
![接口轮换](etc/%E7%A4%BA%E4%BE%8B%E5%9B%BE%E7%89%87/%E6%8E%A5%E5%8F%A3%E8%BD%AE%E6%8D%A2.png)
![独立风控](etc/%E7%A4%BA%E4%BE%8B%E5%9B%BE%E7%89%87/%E7%8B%AC%E7%AB%8B%E9%A3%8E%E6%8E%A7.png)

![商户后台](etc/%E7%A4%BA%E4%BE%8B%E5%9B%BE%E7%89%87/%E5%95%86%E6%88%B7%E5%90%8E%E5%8F%B0.png)
![自主提现](etc/%E7%A4%BA%E4%BE%8B%E5%9B%BE%E7%89%87/%E8%87%AA%E4%B8%BB%E6%8F%90%E7%8E%B0.png)
![子账号](etc/%E7%A4%BA%E4%BE%8B%E5%9B%BE%E7%89%87/%E4%BB%A3%E7%90%86-%E5%AD%90%E8%B4%A6%E5%8F%B7.png)

### 安装教程
1.  下载并安装nodejs([下载地址](https://nodejs.cn/download/)) 本项目使用的是16.13.2版本
2.  下载本项目,在本项目根目录下,运行 node install (进行依赖库的安装)
3.  启动 __runtime__ 文件夹下 mongoDB([下载地址](https://www.mongodb.com/try/download/community))数据库,或者连接您已安装好的数据库
4.  node app.js 启动项目
5.  浏览器访问 http://127.0.0.1:7856/
6.  项目的配置文件在config文件夹下 constant.js 中

### 使用说明

1.  使用vscode 编辑器
2.  mongoDB 数据库
3.  nodeJS 运行服务

### 主要库

1.  axios
2.  lodash
3.  log4js
4.  mongojs
5.  nunjucks
6.  qr-image
