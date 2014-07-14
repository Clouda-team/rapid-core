# rapid-core
> rapid-core, 是用于rapid+ framework中进行资源管理与载入控制的核心部份.

## What is this?
rapid将一个系统的各种资源进行划分后抽像为三类资源,即config(配置信息),resource(运行时可变资源),plugin(可运行的提供功能的内容).三类资源通过相互间的交叉引用构成整个系统的运行时架构. 所有开发过程中都需要解决的即是资源的管控. rapid-core将主要用于提供这三类资源管理及载入方案.

	rapid.plugin : 提供可执行的功能的部分被定义为插件.每个插件都将实现一种特定的能力(如包装数据源访问,提供httpServer或socketServer的包装能力等.)

	rapid.config : 系统启动前被载入的并且一般在运行时不会产生变化的配置信息被归为config

	rapid.resource : 在系统运行时产生的,整个运行过程中,会产生变化的数据被归类为resource.

其中config与resource在运行时并没有差异,只是在名称上做了区分.

## How to runing?

> 以下简单介绍了rapid-core的运行过程,同时示范如何使用rapid-core.

1. 当执行require("rapid-core")时,将自动提供名称为"rapid"的全局对像,以及define,watch,use等三个方法.
2. 检测ROOR_DIR,USER_DIR,CONF_DIR等三个全局常量是否存在,如果不存在会自动创建以下默认值.

		rapid.ROOT_DIR = GLOBAL.ROOT_DIR = path.join( process.argv[1] || __dirname, "../");
		rapid.USER_DIR = GLOBAL.USER_DIR = path.join(ROOT_DIR , "./app/");
		rapid.CONF_DIR = GLOBAL.CONF_DIR = path.join(ROOT_DIR , "./conf/");

3. 自动检测CONF_DIR是否存在,以及其下是否有可载入的.js文件,若有则进行载入,每个载入的文件应该用来定config,增加resource,注册简单的plugin等动作,可以使用以下写法.

		rapid.resource.define("appName","rapid+ App Framework");
		
		rapid.config.define("rapid-httpserver",{
			port : 8888,
			autoStart : true
		});
		
		rapid.plugin.define("sayHi",function(cb){
			cb(null,{
				say:function(namy){
						return "Hi," + name
					}
			});
		});
		
	// 或可以使用以下简略写法:
 
		define({
			"resource.appName":"rapid+ App Framework",
			"config.rapid-httpserver" : {
					port : 8888,
					autoStart : true
				},
			"plugin.sayHi":{
					say:function(namy){
						return "Hi," + name
					}
				}
			})
			
4. 对于一些相互间存在依赖的内容,可以使用watch方法添加一个监视动作.当需要监视的资源存在的时候,触发回调.进行下一步操作.以下示范了watch的使用方式
		
		// waiting resource
		rapid.resource.watch("appName",function(name){
			console.log("find appName is [%s], at time : %d" , name, Date.now());
			rapid.resource.watch("version",function(ver){
				
				console.log("find version is [%s], at time : %d" , ver, Date.now());
				
				rapid.resource.define("fullAppName",name + "@" + ver);
				rapid.plugin.define("talker",function(cb){
					cb(null,{
						say:function(){
							console.log("hi, i am [" + rapid.resource.fullAppName + "]");
						}
					})
				})
			});
		})
		
		//延迟..
		setTimeout(function(){
			console.log("set appName at %d", Date.now());
			define({
				"resource.appName" : "rapidAppFramework"
			});
			
			// 再延迟..
			setTimeout(function(){
				console.log("set version at %d", Date.now());
				define({
					"resource.version" : "0.0.1#Preview"
				});
			},1000)
			
		},1000)
		
		//直到有talker
		rapid.plugin.watch("talker",function(talk){
			console.log("find talker, at time : %d" , Date.now());
			talk.say();
		});	
		
	//同样可以使用全局的watch方法,以对以上demo进行简化
				
		watch("resource.appName","resource.version",function(name,ver){
			define({
				"resource.fullAppName" : name + "@" + ver , 
				"plugin.talker" : {
					say:function(){
						console.log("hi, i am [" + rapid.resource.fullAppName + "]");
					}
				}
			});
		});
		
		watch("plugin.talker",function(talker){
			talker.say();
		})
		
		//相同的延迟处理..
		setTimeout(function(){
			console.log("set appName at %d", Date.now());
			define({
				"resource.appName" : "rapidAppFramework"
			});
			
			// 再延迟..
			setTimeout(function(){
				console.log("set version at %d", Date.now());
				define({
					"resource.version" : "0.0.1#Preview"
				});
			},1000)
		},1000)

	// 以上两种写法最终都可以在console中得到输出结果
	
		"hi, i am [rapidAppFramework@0.0.1#Preview"
5. 基于以上的资源定义和使用的方式,可以使所有资源异步声明,因此做到对文件载入顺序和资源使用顺序的无依赖.从而做到批量从外部载入文件.
 		
 		//批量载入一个目录下的所有.conf.js结尾文件.
 		rapid.requireDir("/actions",/.*\.conf\.js/);
 		
	对于外部载入的文件,为了再次简化watch的写法, 提供另一种更为简单的use方法.为了示范无序载入,这里定义了两个外引文件. 分别为 include_1.js与include_2.js.并放在与启动文同目录下.
	

		// include_1.js
		var name = use("resource.appName");
		var ver = use("resource.version");
		
		define("resource.fullAppName",name + "@" + ver);
		
		define("plugin.talker", {
			say:function(){
				console.log("hi, i am [" + rapid.resource.fullAppName + "]");
			}
		});
		
	--------
	
		// include_2.js
		var talker = use("plugin.talker");
		talker.say();
		
	--------
		
		//启动文件
		
		//载入目录下以  include开头的js文件
		rapid.requireDir("./",/include.*\.js/);
		
		//相同的延迟注册处理..
		setTimeout(function(){
			console.log("set appName at %d", Date.now());
			define({
				"resource.appName" : "rapidAppFramework"
			});
			
			// 再延迟..
			setTimeout(function(){
				console.log("set version at %d", Date.now());
				define({
					"resource.version" : "0.0.1#Preview"
				});
			},1000)
			
		},1000);
		
##API Document

###全局属性和方法

> rapid在全局范围内创建了几个属性和方法用于改善调用复杂度,一般情况下,使用这些方法就能很好的使用rapid-core.

####ROOT_DIR
指向启动文件所在的目录. 一般认为这个目录应该是应用的根目录.

####USER_DIR
用户文件的目录. 默认为: ROOT_DIR/app/

####CONF_DIR
存放配置文件的目录,默认为: ROOT_DIR/conf/, 系统将自动监测这个目录并载入下面的js文件

####define(map)
rapid.define()的快捷方式

####watch(key1,key2,key3...keyN,callback);
rapid.watch()的快捷方式

#### ***use(key);***
同步返回key所表示的资源内容.如果不存在则返回undefined, 

***这个方法在被requireDir所载入的文件中被使用时. 将被框架监测其中key所指资源是否存在,做为一种依赖的声明. 只有在资源存在时才真正载入这个文件.从而使use方法返回正确的值. ***

*** !!! 需要注意的是,当文件中存在循环依赖时,可能导至一个或多个文件永远不能被载入,所以使用时应当小心这种情况 ***


###对像

####Watcher
一个可监测自身变改的名称空间对像. 提供define,watch,remove,unwatch.四个方法.

#####define(name,value)
用于定义或改变当前空间的下属资源.

#####remove(name)
用于删除一个已定义的资源

#####watch(name,handle,once)
用于监视一资源的变化,无论对应资源是否存在.

#####unwatch(name,handle)
删除对一个资源的一个监视方法.


### 属性
####rapid.resource
一个watcher对像, 用于存放在全局范围内运行时会改变的一类资源.

####rapid.config
一个watcher对像, 用于存放在全局范围内运行时不会改变或很少改变的一类配置资源

####rapid.plugin
一个watcher对像, 用于存放在在全局范内被公开访问的可执行的插件资源
	
###方法

####rapid.define(obj);
提供一个简单的方式来定义多个资源.方法接收一个map,其key为使用 "."分隔的资源名称的表示,前半部份应该为resource,config.plugin三者之一.

####rapid.watch(key1,key2,key3...keyN,callback);
提供一个简单的方式同时监测多个资源是否存在. 当所有资源都存在时,执行一个回调.并以相同的顺序将所需的资源传入callback中. 其key应为使用"."分隔的资源名称的表示,前半部份应该为resource,config.plugin三者之一.

####rapid.requireDir(path,limit,isAbsPath);
用于载入一个目录下的js文件.

path {string}: 目标路径.

limit {RegExp}: 用于限制载入文件的一个正则对像,只载入名称相配置的文件,而忽略其它的.

isAbsPath {Boolean}: 用于标识path所表示的是否为绝对路径.当值为isAbsPath不明确为true时,当path以 "/" 开头, 将会在自动在前面补充 ROOT_DIR + path 进行访问


####rapid.createWatcher();
取得一个watcher对像的工厂方法