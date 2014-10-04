/**
 * test the rapid function
 */
require("../src/rapid-core.js");

rapid({
    'config.a':100,
    'config.b':200,
    'resource.c':300
});

rapid(["config.a","config.b","resource.c"],function(a,b,c){
    debugger;
    console.log(Math.max(a,b,c));
})

rapid("config.a","config.b","resource.c","plugin.counter",function(a,b,c,opt){
    debugger;
    console.log(opt.count(a,b,c));
})

rapid.define("plugin.counter",{
    count:function(a,b,c){
        return a+b+c;
    }
});

debugger;
console.log(rapid("resource.c") + 1);

