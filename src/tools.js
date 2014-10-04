/**
 * @file 一些工具方法
 * @author wangsu01@baidu.com
 * @module rapid/tools
 */

var _argsToArr = (function(slice){
    return function(args){
        return slice.call(args,0);
    };
})(Array.prototype.slice);

/**
 * 生成包含[a-zA-Z0-9]的指定长度的随机字符串
 * @param {number} len 指定长度,默认为 10;
 * @return {string} 生成的指定长度字符串
 */ 
var randomStr = function(_len){
	var rv,str = [] , len = _len || 10;
	for(; str.length < len ; str.push((~~(Math.random() * 36)).toString(36)));
	rv = str.join("");
	return rv; 
};

var reg_getFunArgs = /function\s.*?\((.*?)\)\{.*/;
var reg_removeMultilineComment = /\/\*[\w\W]*?\*\//gm;
var reg_removeLineComment = /\/\/.*$/gm;
var reg_removeLF = /\s*\n\s*/gm;

/**
 * 取得一个function的参数列表.
 * 方法将一个function的参数列表,以Array<string>的方式返回
 * @param {function} fun  需要分析的function 
 * @returns {Array<string>}
 */
var getFunArgs = function(fun){
    
    var funStr , len = fun.length ,rv = [], argsStr;
    
    if(len == 0){
        return rv;
    }
    
    funStr = fun.toString();
    funStr = funStr.replace(reg_removeMultilineComment,"");
    funStr = funStr.replace(reg_removeLineComment,"");
    funStr = funStr.replace(reg_removeLF,"");
    
    var parts = reg_getFunArgs.exec(funStr);
    
    if(parts && (argsStr = parts[1])){
        rv = argsStr.trim().split(/\s*,\s*/mg);
    }
    
    return rv;
};

/**
 * 将给定的一个js文件的内容清除注释内容与回车换行等内容并返回
 * @param content {String} 将清除的JS文件内容的字符串
 * @param keepCRLF {boolean} 是否保留换行
 * @returns {String} 清除后的内容
 */
var cleanJSFile = function(content,keepCRLF){
	content = content.replace(reg_removeMultilineComment,"");
	content = content.replace(reg_removeLineComment,"");
	if(!keepCRLF){
		content = content.replace(reg_removeLF,"");
	}
	return content;
};
/**
 * 用于包装setImmediate,nextTick,setTimeout,
 * 便于在下一个eventLoop中执行一个function.
 * 
 * @inner
 * @param {function} arg0 将被执行的function
 * @param {any} arg1,arg2...argN 被传入function的参数
 */
var _runnext = function(){
    var _args = _argsToArr(arguments);
    if(typeof(setImmediate) == "function"){
        // 存在setImmediate则直接使用
        setImmediate.apply(null,_args);
    }else if(process && process.nextTick instanceof Function){
        // 0.10之前,没有setImmediate.
        process.nextTick(function(){
            var args = _args.slice(0);
            var runner = args.shift();
            runner.apply(null,args);
        });
    }else{
        // 非node环境没有process对像
        _args.splice(1,0,0);    // make the args[1] is 0  
        setTimeout.apply(null,arguments);
    }
};

/**
 * @export rapid/tools
 */
module.exports = {
    randomStr: randomStr,
    getFunArgs:getFunArgs,
    cleanJSFile:cleanJSFile,
    _runnext:_runnext,
    _argsToArr:_argsToArr
};