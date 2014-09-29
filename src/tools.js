/**
 * @author wangsu01@baidu.com
 * @module rapid/tools
 * @file 工具方法.
 */
/**
 * 生成包含[a-zA-Z0-9]的指定长度的随机字符串
 * @param {number} len 指定长度,默认为 10;
 * @return {string} 生成的指定长度字符串
 */ 
var randomStr = function(_len){
	var rv,str = [] , len = _len || 10;
	for(; str.length < len ; str.push((~~(Math.random() * 36)).toString(36)));
	rv = str.join("");
	str.length = 0;
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
}


var tools = {
    randomStr: randomStr,
    getFunArgs:getFunArgs,
    cleanJSFile:cleanJSFile
};

module.exports = tools;
