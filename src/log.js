/**
 * 日志工具
 */
var format = require("util").format;
var fs = require('fs');

var argumentsToArray = function(args){
    return Array.prototype.splice.call(args,0);
};

var log = null;

/*
 * 日志级别， 由细到粗为
 * 
 * DEV -> INFO -> WARN -> ERR -> CRASH 
 * 
 */
var LOG_LEVEL = {
    DEV   : 10 ,
    INFO  : 20 ,
    WARN  : 30 ,
    ERR   : 40 ,
    CRASH : 50 
};

// 输出和输出对像
var outInfo = process.stdout, outErr = process.stderr;

var template = "[%s][%s] %s; (%s)\n";     // 日志格式

var currentLevel = 20;      // 当前输入级别.
var errOutBegin = 30;       // 高于这个值的级别，将输出至outErr，否则输出至outInfo.

// 啥也不干的空方法
var nope = function(){
    //console.log("call nope , %s" , arguments);
};

var getStack = function(opt){
    var reg = /\n\s*/g;
    var err = {} , stack;
    Error.captureStackTrace(err, opt || arguments.callee);
    stack = err.stack;
    stack = stack.split(reg);
    stack.splice(0,1);
    return stack;
};

var getDateStr = null;

var out = function(lstr,level,msg,stack,caller){
    
    lstr = lstr.toUpperCase();
    
    var l = level, outStream = null , content;
    
    if( l >= errOutBegin){
        outStream = outErr;
    }else{
        outStream = outInfo;
    }
    
    content = format(template,lstr,getDateStr(),msg,stack);
    
    outStream.write(content);
};

var makeHandle = function(lab,level){
    return function(msg){
        var stack = getStack(arguments.callee)[0];
        var content = arguments.length == 1 ? msg : format.apply({},arguments) ;
        out(lab,level,content,stack);
    };
};

var init = function(conf){
    
    // 保证只初始化一次..防止多次载入影响.
    if(log != null){
        return log;
    }
    
    // 处理配置级别
    if(conf.level){
        
        if(typeof(conf.level) == "number"){
            currentLevel = conf.level;
        }else{
            currentLevel = LOG_LEVEL[conf.level.toUpperCase()] || LOG_LEVEL['INFO'];
        }
        
    }
    
    // 日期格式
    switch((conf.formatDate||'local').toUpperCase()){
        case "TIMESTAMP" : 
            getDateStr = function(){
                return Date.now();
            };
            break;
        case "GMT" :
            getDateStr = function(){
                return (new Date()).toGMTString();
            };
            break;
        case "UTC" :
            getDateStr = function(){
                return (new Date()).toUTCString();
            };
            break;
        case "ISO" :
            getDateStr = function(){
                return (new Date()).toISOString();
            };
            break;
        case "JSON" :
            getDateStr = function(){
                return (new Date()).toJSON();
            };
            break;
        case "LOCAL":
        default:
            getDateStr = function(){
                return (new Date()).toLocaleString();
            };
    }
    
    // 输出位置
    var outputInfo = conf.outputInfo || "default";
    var outputErr = conf.outputErr || "default";
    
    if(outputInfo == 'default'){
        outInfo = process.stdout;
    }else{
        outInfo = fs.createWriteStream(conf.outputInfo,{flags:"a+",encoding:'utf-8'});
        outInfo.write("\n\n [rapid-log] start record at " + getDateStr());
    }
    
    if(outputErr == 'default'){
        outputErr = process.stderr;
    }else{
        outErr = fs.createWriteStream(conf.outputErr,{flags:"a+",encoding:'utf-8'});
        outErr.write("\n\n [rapid-log] start record at " + getDateStr());
    }
    
    
    /**
     * 日志对像.
     * 
     * 这里直接判断日志级别，将需要进行输出的方法直接置为nope，用于降低执
     * 行过程中的判断次数，由此产生的问题是，日志级别一但指定，则不能更改。
     */
    
    var rv = {} , key , tmpLevel;
    var customLevel = conf.customLevel || {};
    
    for(key in customLevel){
        tmpLevel = customLevel[key];
        if(currentLevel > tmpLevel){
            rv[key] = nope;
        }else{
            rv[key] = makeHandle(key,tmpLevel);
        }
    }
    
    // 默认方法优先.
    for(key in LOG_LEVEL){
        
        tmpLevel = LOG_LEVEL[key];
        
        key = key.toLowerCase();
        if(currentLevel > tmpLevel){
            rv[key] = nope;
        }else{
            rv[key] = makeHandle(key,tmpLevel);
        }
    }
    
    return log = rv;
};

var defaultConfig = {
   level : 'DEV',
   formatDate : "JSON",
   outputInfo : "default",
   outputErr : "default",
};

/**
 * 环境检测.
 * 当运行于rapid环境时，依赖__watch获到配置.
 */
if(typeof(rapid) != "undefined"){
	
	var watchConfig = function(conf){
		clearTimeout(timer);
		GLOBAL.log = rapid.log = init(conf);
		rapid.log.info("rapid-log start...");
		rapid.plugin.defineSync("rapid-log",function(){
			return GLOBAL.log;
		});
	}
	
	var timer = setTimeout(function(){
		console.log("Timeout : waiting the config of rapid-log , will be auth-start by default config");
		rapid.config.unwatch('rapid-log',watchConfig);
		watchConfig(defaultConfig);
	},1000);
	
	rapid.config.watch('rapid-log',watchConfig);
}else{
    module.exports = init;
}



