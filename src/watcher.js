/**
 * 一个可监测变化的对像
 * __rush, 是否立即触发监视资源的变化, 当明确为false的时候,才进行优化处理.
 */
function Watcher(__rush){
	
	var trapPool = {};
	
	/**
	 * 定义一个资源
	 */
	Object.defineProperties(this,{
		'define':{
			configurable:true,
			enumerable:false,
			writable:false,	
			value:function(name,value){
				
				if(typeof(name) == "object" && !value){
					for(var key in name){
						this.define.call(this,key,name[key]);
					}
					return;
				}
				
				delete this[name];  
				
				/**
				 * 这里本来更好的方式是直接使用getter/setter，
				 * 但是由于js限制使用getter/setter的对像，只能设置2048个属性。
				 * 所以只能退而求其次使用defineProperty来定义一个只读属性，所有变更只能使用define方法
				 */
				
				Object.defineProperty(this,name,{
					configurable:true,
					enumerable:true,
					writable:false,	// 不能被修改,防止watch方法不被触发导至的错误
					value:value
				});
				
				//这里创建后就始终保持一个引用不再创建新数组;
				var traps = trapPool[name] || ( trapPool[name] = [] );
				
				var __executeMe = function(value){
					var len = 0 , item;
					if((len = traps.length) > 0){
						for(var i = len-1; i >= 0; i-- ){
							item = traps[i];
							item(value)
						}
					}
				}
				
				/**
				 * 明确的false,才进行优化,否则都是rush处理 
				 */
				if(__rush !== false){
					
					// rushed 
					__executeMe(value);
					
				}else{
					// softly 优化处理, 每个资源的traps在同一个时间周期内的多次变化,只执行最后一次.
					traps.__cancelTimer && traps.__cancelTimer();
					
					traps.__cancelTimer = (function(exec,value){
						var timer = null;
						if(setImmediate){
							timer =  setImmediate(exec,value);
							return function(){
								clearImmediate(timer);
							}
						}else{
							timer =  setTimeout(exec,0,value);
							return function(){
								clearTimeout(timer);
							}
						}
					})(__executeMe,value);
					
					
				}
			}
		},
		/**
		 * 移除一个资源
		 */
		'remove':{
			configurable:false,
			enumerable:false,
			writable:false,	
			value:function(name){
				//这里创建后就始终保持一个引用不再创建新数组;
				var traps = trapPool[name];
				if(traps){
					traps.length = 0;
					delete trapPool[name];
				}
				return delete this[name];
			}
		},
		
		/**
		 * 添加监视
		 */
		
		'watch':{
			configurable:false,
			enumerable:false,
			writable:false,	
			value:function(name,handle,once){
				
				var traps = trapPool[name] || ( trapPool[name] = [] );
				var me = this;
	
				if(!!once){
					
					//这里创建后就始终保持一个引用不再创建新数组;
					var oncefun = function(){
						handle.apply(null,arguments)
						me.unwatch(name,oncefun);
					}
					
					traps.push(oncefun);
				}else{
					traps.push(handle);
				}
				
				// 如果资源存在，默认执行一次;
				if(name in this){
			        if(typeof(setImmediate) == 'function'){
			        	setImmediate(handle,this[name]);
			        }else{
			        	setTimeout(handle,0,this[name]);
			        }
				}
				
				return handle;
			}
		},
		
		/**
		 * 移除监视
		 */
		'unwatch':{
			configurable:false,
			enumerable:false,
			writable:false,	
			value:function(name,handle){
				
				if(!handle){
					return;	// ignore the call with the handle is empty
				}
				
				var traps = trapPool[name];
				var index = traps.indexOf(handle);
				if(index != -1){
					traps.splice(index,1);
				}
			}
		},
		"use":{
			configurable:false,
			enumerable:false,
			writable:false,	
			value:function(name,handle){
				
				if(!handle){
					return this[name];	//sync return, the return 'undefined' is passable
				}
				
				this.watch(name,handle,true); // async
			}
		}
		
	});
};

module.exports = Watcher;
