/**
 * New node file
 */
require("../src/rapid-core.js");

var assert = require('assert');

var define = rapid.define;
var watch = rapid.watch;
var use = rapid.use;

define({"config.rapid-log":{
        /**
        * 日志级别, 由细到粗为
        * 
        * DEV:10 -> INFO:20 -> WARN:30 -> ERR:40 -> CRASH:50
        * 
        * default : INFO;
        */
       level : 'INFO',
       /**
        * 时间格式
        * 
        * TIMESTAMP ,ISO , GMT , UTC , LOCAL , JSON
        */
       formatDate : "JSON",
       /**
        * 一般性日志输出位置,
        * default: 输出至stdout, 如果启动node时，配置了stdout，建议这里保持default.
        * pathStr: 输出至目标文件
        * "tcp://xxxxxxxxx" : 输出至目标tcp服务器,    暂未实现
        * "http://xxxxxxxxx" : 输出至目标http服务器,  暂未实现
        */
       outputInfo : "default",
       /**
        * 错误性日志输出位置,
        * default: 输出至stderr ， 如果启动node时，配置了stderr，建议这里保持default.
        * pathStr: 输出至目标文件
        * "tcp://xxxxxxxxx" : 输出至目标tcp服务器,    暂未实现
        * "http://xxxxxxxxx" : 输出至目标http服务器,  暂未实现
        */
       outputErr : "default",
}});

log.dev("not out...");
log.info("out something...");

//debugger;
rapid.includeJS("./test-use.js");

define({
	"plugin.testFun":{
		out:function(str){
			log.info("call testFun.out: %s", str);	
		}
	},
	"resource.appName":"123456789",
	"config.testConfig":{
		a:100,
		b:200,
		c:300
	}
});

watch("config.testConfig",function(conf){
	// define的另一种写法
	define("plugin.outConfigSum",{
		out:function(){
			assert(conf.a == 100 & conf.b ==200 && conf.c == 300 , "values of config is not right");
			return conf.a + conf.b + conf.c;
		}
	});
})

watch("plugin.testFun","plugin.outConfigSum",function(fun,sum){
	fun.out("value : " + sum.out());	// out
});

log.info("define testFun. ok!");


