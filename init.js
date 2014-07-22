var fs = require("fs");
var path = require("path");

var cwdpath = process.cwd();

var pkgpath = path.resolve(cwdpath, "./package.json");
var startpath = path.resolve(cwdpath, "./start.js");
var tplpath = path.resolve(__dirname, "./start.tpl.js");

console.log('@pkgpath:', pkgpath);

fs.exists(pkgpath, function (exists) {

	if(exists) {

		fs.readFile(pkgpath, function(err, data){

			try {
				var info = JSON.parse(data.toString());
				var deps = info.dependencies;
				if(deps){
					
					var keys = Object.keys(deps);

					var rapidlibs = keys.filter(function(lib){

						return (lib.indexOf("rapid-") >= 0);

					});

					var requires = "";

					rapidlibs.forEach(function(lib){

						requires += 'require(\"' + lib + '\");\n';

					});


					console.log('@tplpath:', tplpath);
					fs.readFile(tplpath, function(err, tpl){

						var content = tpl.toString().replace("$_requires_$", requires);

						console.log('@startpath:', startpath);						
						fs.writeFile(startpath, content);

					});
				}

			} catch (e) {
				console.log("err with package.json", e);

			}

		});

	} else {

		console.log('cannot find package.json');

	}

});

