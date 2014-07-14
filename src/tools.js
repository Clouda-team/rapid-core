/**
 *  乱槽槽的工具方法.
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
 *  
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
