/**
 * New node file
 */
var Watcher = require("../src/watcher.js");
var assert = require("assert");
var base = new Watcher();

assert(!!base,"can not get a watcher");


var changeA=0;  watchAOne = 0, watchAEvery = 0;
base.watch("a",function(a){
	console.log("once a is %s",a);
	watchAOne++;
	assert(watchAOne == 1,'watch "a" once faile' + watchAOne);
},true)

base.watch("a",function(a){
	console.log("every a is %s",a);
	watchAEvery++;
	assert(watchAEvery == changeA, 'watch "A" every faile,change:' + changeA + " , watch:" + watchAEvery);
});

changeA++;
base.define("a",1);

changeA++;
base.define("a",2);

changeA++;
base.define("a",2);

console.log("\n\n===============  \nbase watch all success! \n===============  \n\n");

var rushww = new Watcher();
var norushww = new Watcher(false);

var outValue = "";
var test = function(ww,isRush){

	var watfun = ww.watch("name",function(value){
		console.log(value);
		
		if(!isRush){
			assert(value != 'rapid+',"faile to test the rush watcher, not ignore the 'rapid+' ");
			assert(value != 'heihei..',"faile to test the rush watcher, not ignore the 'heihei..' ");
		}
		
		assert.equal(value,outValue);
		
	});
	
	ww.define("name",outValue = "rapid+");	// when rush === false , ignore that rapid+ 
	ww.define("name",outValue = "rapidjs+")	// output : rapidjs+

	setImmediate(function(){
		ww.define("name",outValue = "hahaha.."); // output : hahaha..
		
		setImmediate(function(){
			ww.define("name", outValue = "heihei.."); // when rush === false, ignore heihei..
			ww.unwatch("name",watfun);
			
			
			ww.use("name",function(a){
				
			});
			
			console.log("\n\n===============  \nrush watch all success! \n===============  \n\n");
		});
	});
}

test(norushww,false);
test(rushww,true);

