/**
 * nodejs express application
 * run:node app
 * 
 * @name node express
 * @author SalsNET 
 * @time 2022.3.16
 * @copyright 2013-Now
 * 
 */

const { StartModel } = require('./config/constant');
let init = require('./config/initialize');
// PRODUCTION DEBUG
init.launch(StartModel.DEBUG, 7856);