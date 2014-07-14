/**
 * start.js
 * launch the clouda+
 */

var path = require("path");

GLOBAL.ROOT_DIR = path.join( process.argv[1] || __dirname, "../");
GLOBAL.USER_DIR = path.join(ROOT_DIR , "./app/");
GLOBAL.CONF_DIR = path.join(ROOT_DIR , "./conf/");

$_requires_$

// 自动检测配置目录并载入
rapid.autoConfig();