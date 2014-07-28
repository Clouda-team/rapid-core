/**
 * rapid Core
 */

var path = require('path');
var fs = require('fs');
var tools = require("./tools.js");
var Watcher = require('./watcher.js');

var isJsFile = /(.+)\.js$/i;
var toString = Object.prototype.toString;
var requireList = {};

var stdLog = function(args,type){
	
	type = type || "info";
	
	if(typeof(log) != "undefined"){
		log[type].apply(log,args);
	}else{

		switch(type){
			case "err":
			case "crash":
				console.error.apply(console,args);
				break;
			case "warn":
				console.warn.apply(console,args)
			case "info" :
			default :
				console.log.apply(console,args);
		}
	}
}

/**
 * 解析一个JS文件,分析出其中所使用的依懒. 
 * 即var xxx = use("xxxx"). 并返回所依赖的xxxx的列表.
 * !! 解析过程中,不能找出use({variable})的调用方式,只能找到直接通过字符串调用
 * 
 */
var parseJSFile = function(fname,cb){
	var findUse = /rapid\.use\(['"](.*?)['"]\)/gm;
	var hackUse = {use:function (str){return str}};
	
	if(toString.call(cb) == '[object Function]'){
		// 异步
		fs.readFile(fname,{encoding:"utf8"},function(err,content){
			var matchs ,rsArr = [] ;
			
			if(err){
				cb(err,null);
				return;
			}
			
			var cleanContent = tools.cleanJSFile(content);
			matchs = cleanContent.match(findUse);
			matchs.forEach(function(item){
				var fun = new Function("rapid","return " + item);
				rsArr.push(fun(hackUse));
			});
			
			cb(null, rsArr);
		});
	}else{
		var content = fs.readFileSync(fname,{encoding:"utf8"});
		var cleanContent = tools.cleanJSFile(content); 
		var matchs ,rsArr = [] ;
		matchs = cleanContent.match(findUse) || [];
		matchs.forEach(function(item){
			var fun = new Function("rapid","return " + item);
			rsArr.push(fun(hackUse));
		});
		
		return rsArr;
	}
}

var rapid = function(arg0){
	switch(toString.call(arg0)){
		case "[object String]" :
			// require js file
			break;
		case "[object Object]" :
			// define map
			break;
		case "[object Function]" :
			//callback
			break;
		case "[object Array]" :
			//callback when the depends all readied
			break;
		default:
	}
};

/**
 * 目录判断，如果在外面预先提供，则直接使用外面提供的，否则做默认处理
 */
rapid.ROOT_DIR = GLOBAL.ROOT_DIR = GLOBAL.ROOT_DIR || path.join( process.argv[1] || __dirname, "../");
rapid.USER_DIR = GLOBAL.USER_DIR = GLOBAL.USER_DIR || path.join(ROOT_DIR , "./app/");
rapid.CONF_DIR = GLOBAL.CONF_DIR = GLOBAL.CONF_DIR || path.join(ROOT_DIR , "./conf/");

Object.defineProperties(rapid,{
    //配置池,全局可用.
    config:{
        value: new Watcher(),
        configurable:false,
        enumerable:false,
        writable:false
    },
    //插件系统
    plugin:{
        value: new Watcher(),
        configurable:false,
        enumerable:false,
        writable:false
    },
    //资源池，全局可用.
    resource:{
        value: new Watcher(),
        configurable:false,
        enumerable:false,
        writable:false
    },
    // 方便其它插件中使用watcher对像，提供工厂方法.
    createWatcher:{
    	value: function(){
    		return new Watcher();
    	},
        configurable:false,
        enumerable:false,
        writable:false
    },
    /**
     * 提供一种快速定义的方法
     */
    define:{
    	value:function(_key,_val){
    		
    		var opt, keyParts, type , name, value , target;
    		
    		switch(typeof(_key)){
    			case "string":
	    			opt = {};
	    			opt[_key] = _val;	// 有可能是undefined, 但是认为是正常的
	    			break;
    			case "object":
    				opt = _key;
    				break;
    			default:
    				stdLog(["define:can not process this [%s]" , key],"warn");
    				return this;
    		}
    		
    		for(var key in opt){
    			
    			value = opt[key];
    			keyParts = key.split(".");
				type =  keyParts[0]; 
    			target = rapid[type];
				name = keyParts[1];
				
				switch(type){
					case "config":
					case "resource":
						target.define(name,value);
						break;
					case "plugin":
						target.defineSync(name,function(){return value});
						break;
					default:
						stdLog(["define:can not process this [%s]" , key],"warn");
				}
    		}
    		
    		return this;
    	},
    	configurable:false,
    	enumerable:false,
    	writable:false
    },
    watch:{
    	value:function(/*arg1,arg2...argN,cb*/){
    		
    		var cb = Array.prototype.pop.call(arguments);
    		var len = arguments.length;
    		
    		var keyParts , arg , type, target , name;
    		var waitingNum = 0;
    		var rs = []
    		
    		if(!cb instanceof Function){
    			throw new Error("callback is not function!");
    		}
    		
    		if(len == 0){
    			cb();
    			return;
    		}
    		
    		for(var index in arguments){
    			arg = arguments[index];
    			keyParts = arg.split(".");
    			
    			if(keyParts.length == 2){
    				type = keyParts[0];
    				name = keyParts[1];
    				target = rapid[type];
    				
    				if(target){
    					waitingNum ++;
    					target.watch(name,(function(i){
    						return function(value){
    							rs[i] = value;
    							
    							if(--waitingNum <= 0){
            						cb.apply(null,rs);
            					} 
    						}
    					})(index),true)
    				}
    			}

    		}
    		
    		return rapid;
    	},
    	configurable:false,
    	enumerable:false,
    	writable:false
    },
    /**
     * use 为同步执行并返回资源,异步
     */
    use:{
    	value:function(key){
    		var parts = key.split(".");
    		var type,key;
    		
			if(parts.length == 2){
				type = parts[0];
				key = parts[1];
    		}else if(parts.length == 1){
    			type = "plugin"
				key = parts[0];
    		}else{
    			return null;
    		}
    		return rapid[type] && rapid[type][key];
    	},
    	configurable:false,
    	enumerable:false,
    	writable:false
    },
    /**
     * 载入一个js文件
     */
    includeJS:{
    	value:function(name){
//    		debugger;
    		var fname = path.resolve(name);
    		var depends = parseJSFile(fname);
    		if(depends.length == 0){
    			require(name);
    		}else{
    			depends.forEach(function(item,index){
    				if(item.indexOf(".") == -1){
    					depends[index] = "plugin." + item; 
    				}
    			});
    			
    			depends.push(function(){
    				require(fname);
    			});
    			
    			this.watch.apply(this,depends);
    		}
    	},
    	configurable:false,
        enumerable:false,
        writable:false
    },
    /**
     * 载入一个目录下所有JS文件
     */
    requireDir:{
        value:function(dirpath,limit,isAp){
            var fullDir , me = this;
            isAp = isAp || false;
            
            limit = limit || (isJsFile);
            
            if(isAp){
            	fullDir = dirpath;
            }else{
            	if(dirpath[0] != "/"){
            		fullDir = path.resolve(dirpath);
            	}else{
            		fullDir = path.join(ROOT_DIR , dirpath);
            	}
            }
            
            if(fs.existsSync(fullDir)){
                
                var files = fs.readdirSync(fullDir);
                files.forEach(function(fname){
                    if(limit.test(fname)){
                        try{
                            me.includeJS(path.join(fullDir,fname));
                            stdLog(["requireDir: require [%s] ok! ",fname],'info');
                        }catch(e){
                        	stdLog(["failed to require [%s] , Error: %s",fname,e.stack],'err');
                        }
                    }
                });
            }else{
            	stdLog([" the directory [%s] is not exists [%s]",fullDir] , 'err');
            }
        },
        configurable:false,
        enumerable:false,
        writable:false
    },
    /**
     * 检测配置目录是否存在,并载入其下的js文件
     */
    autoConfig:{
    	value:function(){
        	/**
        	 * 配置项载入
        	 */
        	if(fs.existsSync(CONF_DIR)){
        		stdLog(["find the configure directory, automatic loading those [%s/*.js]",CONF_DIR],'info');
        		rapid.requireDir(CONF_DIR , isJsFile , true);
        	}

        },
        configurable:false,
        enumerable:false,
        writable:false
    }
});

GLOBAL.rapid = rapid;
// GLOBAL.define = rapid.define;
// GLOBAL.use = rapid.use;
// GLOBAL.watch = rapid.watch;

// sort name
var Config = rapid.config , Resource = rapid.resource , 
    Plugin = rapid.plugin , requireDir = rapid.requireDir;

var oldDefineOfPlugin = Plugin.define;	// 保留原始watch能力
var oldDefineOfConfig = Config.define;	// 保留原始watch能力

var working = {};       // 已启动的插件资源
var wating = {};        // 等待启动的插件


/**
 * 检查依赖并启动满足条件的插件
 */
var checkSetup = function(){
    
    var keys = Object.keys(wating);
    
    /**
     * 
     * 检测依赖关系，
     * 
     * FIXME 暂时未处理循环依赖.以及始终不满足执行条件的情况.
     * 
     */
    keys.forEach(function(name){
        var args = [];
        var factory = wating[name][0];
        var depends = wating[name][1];
        var done = wating[name][2];
        
        var canDo = depends.every(function(name){
            
            // 插件系统中内容优先，资源池中置后
            var value = working[name] || Resource[name];
            
            if(value){
                args.push(value);
                return true;
            }
            
            return false;
        });
        
        if(canDo){
            // 先移除，防止callback中检测依赖时产生的循环
            delete wating[name];
            
            //  判断异步及同步
            if(done){
                args.push(done);
                factory.apply({},args);
            }else{
            	try{
            		var value = working[name] = factory.apply({},args); 
            		oldDefineOfPlugin.call(Plugin,name,value);
            	}catch(err){
            		stdLog(["%s ,can not start the plug-in [%s] , \nstack:" , err.stack , name],'crash');
            		process.exit(0);
            		return;
            	}
            }
        }
    });
};

/**
 * 向插件系统中注册一个插件的启动函数. 系统将根据参数
 * 列表决定启动这个插件所需要的依赖关系，并在满足条件
 * 时执行这个函数.
 * 
 * @param name {string} 插件的名称，全局内应当唯一
 * @param factory {function} 启动函数.
 * @param depends {array} 一个可选的字符串数组，
 *      每个字符串应是一个依赖项目的名称。
 *      如果提供这个参数系统将不再根据factory的参数列表进行扫描
 */
var definePlugin = function(name,depends,factory){
    
    // 吐槽：大于3，乱传的，真猜不透是啥...
    if(arguments.length < 3){
        
        // 工厂必须提供
        factory = factory || depends || name;
        
        if(typeof(factory) != "function"){
        	stdLog(["factory is not a function"],'crash');
            process.exit(0);
            return;
        }
        
        if(typeof(name) == "string"){
            depends = false;
        }else if(Array.isArray(name)){
            depends = name;
            /**
             * 如果没有指定name，这里的处理和AMD略有不同，
             * 这里直接认为这个插件不希望再被其它地方利用。
             * 所以直接生成一个不可知的随机ID字符串.
             * 之所以没有直接放弃记录引用，是为后续可能的
             * 生命周期方法(destroy,init)提供可能。
             */
            name = "#PluginId_"+ tools.randomStr(10);
        }
    }
    // 异步注册完成.
    var done = function(err, exports){
        
        if(err){
        	/*
        	 * 由于插件系统是二级API的提供者,所以在一个插件不能正常启动的情况下,
        	 * 可能导至其它存在依赖的插件无法启动,所以当任意插件不能启动时,直接认为crash.
        	 * 如果为希望这种情况发生,请在注册插件的工厂方法中处理异常.
        	 */
        	stdLog(["%s ,can not start the plug-in [%s] , \nstack:" , err.stack , name],'crash');
            process.exit(0);
            return;
        }
        
        
        working[name] = exports;
        
        stdLog(["Plug-in : Loaded [%s]" , name],'info');
        
        // 在插件启动后才可以被其它地方使用，所以只有启动才将实际插件对像注册到Plugin系统中.
        oldDefineOfPlugin.call(Plugin,name,exports);
        
        // 检测可启动插件;
        if(typeof(setImmediate) == 'function'){
        	setImmediate(checkSetup);
        }else{
        	process.nextTick(checkSetup);
        }
    };
    
    // 无依赖，直接启动
    if(factory.length == 1){
        factory(done);
    }else{
        
        if(!depends){
            var params = tools.getFunArgs(factory);
            if(params.length == factory.length){
                params.length = params.length - 1;
                depends = params;
            }else{
            	stdLog(["can not get depends for plug in  [%s]" , name],'crash');
                process.exit(0);
                return;
            }
        }
        
        wating[name] = [factory,depends,done];
    }
    
    // 检测可启动插件;
    if(typeof(setImmediate) == 'function'){
    	setImmediate(checkSetup);
    }else{
    	process.nextTick(checkSetup);
    }
};

var definePluginSync = function(name,depends,factory){
    
    // 吐槽：大于3，乱传的，真猜不透是啥...
    if(arguments.length < 3){
        
        // 工厂必须提供
        factory = factory || depends || name;
        
        if(typeof(factory) != "function"){
            stdLog(["factory is not a function"],'crash');
            process.exit(0);
            return;
        }
        
        if(typeof(name) == "string"){
            depends = false;
        }else if(Array.isArray(name)){
            depends = name;
            /**
             * 如果没有指定name，这里的处理和AMD略有不同，
             * 这里直接认为这个插件不希望再被其它地方利用。
             * 所以直接生成一个不可知的随机ID字符串.
             * 之所以没有直接放弃记录引用，是为后续可能的
             * 生命周期方法(destroy,init)提供可能。
             */
            name = "#PlugId_"+ tools.randomStr(10);
        }
    }
    
    // 无依赖，直接启动
    if(factory.length == 0){
        try{
            var value  = working[name] = factory();
            
            oldDefineOfPlugin.call(Plugin,name,value);
            stdLog(["Plug-in : Loaded [%s]" , name],'info');
        }catch(e){
            stdLog(["%s , can not start the plug-in [%s]" , e.stack, name],'crash');
            process.exit(0);
            return;
        }
    }else{
        
        if(!depends){
            var params = tools.getFunArgs(factory);
            if(params.length == factory.length){
                depends = params;
            }else{
            	stdLog(["can not get depends for plug [%s]" , name],'crash');
                process.exit(0);
                return;
            }
        }
        
        wating[name] = [factory,depends];
    }
    
    // 检测可启动插件;
    if(typeof(setImmediate) == 'function'){
    	setImmediate(checkSetup);
    }else{
    	process.nextTick(checkSetup);
    }
};


Object.defineProperties(Plugin,{
	define:{
		configurable:true,
		enumerable:false,
		writable:false,	
		value:definePlugin
	},
	defineSync:{
		configurable:true,
		enumerable:false,
		writable:false,	
		value:definePluginSync
	}
});

/**
 * overwrite
 * 	to support one argument of object;
 */
Object.defineProperties(Config,{
	define:{
		configurable:true,
		enumerable:false,
		writable:false,	
		value:function(name,value){
			if(typeof(name) == "object" && !value){
				for(var key in name){
					oldDefineOfConfig.call(Config,key,name[key]);
				}
			}else{
				oldDefineOfConfig.apply(Config,arguments);
			}
		}
	}
});


// ready to load other....

require('./log.js');

rapid.plugin.watch('rapid-log',function(log){
	stdLog(["\n\n====== ENV PARAMS ======\n\nROOT_DIR : %s\nUSER_DIR : %s\nCONF_DIR : %s\n\n====== END ENV PARAMS ======= \n",ROOT_DIR,USER_DIR,CONF_DIR],'dev');
});

stdLog(["Welecome!! Initialize RapidJS!! "],'info');

module.exports = rapid;
