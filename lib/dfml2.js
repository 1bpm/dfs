var userspace=require("./userPerformance.js");
var Future = require('fibers/future');
var Fiber = require('fibers');
var DOMParser = require("xmldom").DOMParser;
var XMLNode=require("./xmlNode.js");
var path=require("path");
var fs=require("fs");
var dfs=require("./dfs.js");




var DFML2Document=function(packageDirectory) {
    var self=this;
    this.packageDirectory = path.join(process.cwd(), "dfsPackages", packageDirectory);
    var topNode;
    var DOM=new DOMParser();
    var initScript;
    var xmldoc;
    var score;
    var docCountIn;
    userspace.space.reset();
    
     try {
        var xmlFile = path.join(self.packageDirectory, "composition.xml");
        var contents = fs.readFileSync(xmlFile, "UTF8").replace("\n", "");
    } catch (error) {
        throw "could not read the XML file: "+error;
    }
    try {
        xmldoc = DOM.parseFromString(contents, "text/html");
    } catch (error) {
        throw "the XML file is invalid: "+error;
    }
    userspace.space.setDoc(self);
    var root=new XMLNode(xmldoc);
    var topNode=root.children[0]; // could be anything.
    
    var dfjs=topNode.get("innerValue");
//    
//
//    var root=new XMLNode(xmldoc);
//    var topNode=root.children[0];
//    console.log(topNode);
//
//    initScript="";
//    if (!topNode.hasChild("init")) throw "no init section in xml";
//    
//    topNode.getChild("init").eachChild(function(initChild){
//        switch (initChild.name) {
//            case "script":
//                initScript+=initChild.get("innerValue");
//                break;
//            case "peformance":
//                
//                break;
//        }
//    });
    
//     if (topNode.hasChild("init")) {
//     var initNode=topNode.getChild("init");
//     if (initNode.hasChild("script")) {
//        initScript+=initNode.getChild("script").get("innerValue");
//     }
//  
//     }

    if (!dfjs) throw "no composition data supplied";

//    with (userspace.space) {
//        userspace.space.eval(initScript);
//    }
//
//    score="";
//    if (!topNode.hasChild("score")) throw "no score section in xml";
//    topNode.getChild("score").eachChild(function(initChild){
//        switch (initChild.name) {
//            case "script":
//                score+=initChild.get("innerValue");
//                break;
//            case "perform":
//                
//                break;
//            case "while":
//                break;
//            case "event":
//                break;
//        }
//    });
//


    userspace.space.runScoreTest(dfjs);
    
    
    

    

    //real run
    this.run=function(countIn) {
        if (!countIn) {
            countIn = (docCountIn) ? docCountIn : 5000;
        }

        dfs.emit("performanceStart",{countIn:countIn});
       // userspace.space.eachPerformer(function (client) {
       //     self.emit("performanceStart", {countIn: countIn});
       // });
        setTimeout(function () {
            var ready = true;
            
            userspace.space.eachRole(function (role) {
                role.eachPerformer(function(perf) {
                    if (!perf.client) return;
                    var client=perf.client;
                    if (client.performanceReady !== true) {
                        ready = false;
                        dfs.log.warn(client.name + " is not ready");
                        dfs.view("fatal", {
                            title: "False start",
                            text: "Not all performers are ready. This may be because a session was interrupted between registering and start of the performance."
                        });
                        setTimeout(function () {
                            dfs.view("clearFatal");
                        }, 5000);
                    }
                });
            });
            
            if (ready) {
                
                userspace.space.eachRole(function(role){
                    try {
                        userspace.space.runScore(dfjs,role.name);
                    } catch (e) {
                        dfs.log.warn("eror with score for role "+role.name+" "+e);
                    }
                });

            }
        }, countIn);

    };



 /*   */

};



module.exports=DFML2Document;
