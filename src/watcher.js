/**
 * @author wangsu01@baidu.com
 * @file Watcher对像.
 */

/**
 * 
 * 一个可监测变化的对像
 * __rush, 是否立即触发监视资源的变化, 当明确为false的时候,才进行优化处理.
 * @class Watcher
 * @param {boolean} _rush 用于控制是否需要在每次变化值的时候触发watch回调, 
 *      如果设置为true,则会合并在同一次eventloop执行期间对同一个资源的改变为一次watch触发(用于节省性能,只取最终结果);
 *      如果设置为false, 则会在每次资源变化的时候都触发watch.
 *      default:false
 */
function Watcher(__rush){
	
	var trapPool = {};
	
	Object.defineProperties(this,/** @lends Watcher */{
	    /**
	     * 定义一个资源
	     * @method
	     * @param {string} name 资源名称
	     * @param {any} value 资源值
	     */
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
		 * @method
		 * @param {string} name  将删除的资源名称
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
		 * callback of the watch method;
		 * @callback Watcher.watchHandle
		 * @param {any} newValue 每次变化后的值
		 */
		/**
		 * 添加一个资源监视,每次资源变更的时候将得到通知
		 * @method
		 * @param {string} name 资源名称
		 * @param {Watcher.watchHandle} handle 当资源变化时被触发的值.
		 * @param {boolean} once 是否只触发一次, 默认为false,即持续监视
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
		 * @method
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
		/**
		 * @method
		 */
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
