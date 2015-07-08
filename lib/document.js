/**
 *  dfscore
 *  GPL license, see COPYING
 *  copyright 2015 richard@1bpm.net  
 */

var userspace=require("./userPerformance.js");
var DOMParser = require("xmldom").DOMParser;
var XMLNode=require("./xmlNode.js");
var path=require("path");
var fs=require("fs");
var dfs=require("./dfs.js");




var dfscoreDocument=function(packageDirectory) {
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
   
    var dfjs=contents.replace("<dfscore>","").replace("</dfscore>","");
//    try {
//        xmldoc = DOM.parseFromString(contents, "text/html");
//    } catch (error) {
//        throw "the XML file is invalid: "+error;
//    }
//    
//    var root=new XMLNode(xmldoc);
//    var topNode=root.children[0]; // could be anything.
//    
//    var dfjs=topNode.get("innerValue");


    userspace.space.setDoc(self);
    if (!dfjs) throw "no composition data supplied";

    // test the score and get roles etc
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
                        dfs.log.warn("error with score for role "+role.name+" "+e);
                    }
                });

            }
        }, countIn);

    };



 /*   */

};



module.exports=dfscoreDocument;
