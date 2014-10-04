/**
 * @file 扩展一组原始对像方法
 */

/**
 * 用于快速清空数组
 */
Object.defineProperties(Array.prototype,{
    clean:{
        value: function(){
            var len = this.length;
            while(len--){
                this.pop();
            }
        },
        configurable:false,
        enumerable:false,
        writable:false
    },
});
