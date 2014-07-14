/**
 * New node file
 */
var Watcher = require("../src/watcher.js");
var base = new Watcher();

base.watch("a",function(a){
	console.log("once a is %s",a);
},true)

base.watch("a",function(a){
	console.log("every a is %s",a);
})

base.define("a",1);
base.define("a",2);

var rushww = new Watcher();
var norushww = new Watcher(false);

var test = function(ww){

	var watfun = ww.watch("name",function(value){
		console.log(value);
	});

	ww.define("name","rapid+");	// when rush === false , ignore that rapid+ 
	ww.define("name","rapidjs+")	// output : rapidjs+

	setImmediate(function(){
		ww.define("name","hahaha.."); // output : hahaha..
		
		setImmediate(function(){
			ww.define("name","heihei.."); // when rush === false, ignore heihei..
			ww.unwatch("name",watfun);
		});
	});
}

test(norushww);
test(rushww);