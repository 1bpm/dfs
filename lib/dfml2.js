var userspace=require("./userPerformance.js");
var Future = require('fibers/future');
var Fiber = require('fibers');
var DOMParser = require("xmldom").DOMParser;
var XMLNode=require("./xmlNode.js");
var path=require("path");
var fs=require("fs");
var dfs=require("./dfs.js");

var xmlLoaders={


    roles:function(xml) {
        var readroles=xmldoc.getElementsByTagName("role");
        for (var key in readroles) {
            var node=new XMLNode(readroles[roles]);
            new Role(node.get("name"),node.getData());
        }
    },
    events:function(events) {
        var readevents = xmldoc.getElementsByTagName("event");
        for (var key in root) {
            var node=new XMLNode(root[key]);
            new Event(node.getData()); // check stuff for the innerVal things
        }
    }

};




var DFML2Document=function(packageDirectory) {
    var self=this;
    this.packageDirectory = path.join(process.cwd(), "dfsPackages", packageDirectory);
    var topNode;
    var DOM=new DOMParser();
    var initScript;
    var xmldoc;
    var score;
    var docCountIn;

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

    var root=new XMLNode(xmldoc);
    var topNode=root.children[0];
    console.log(topNode);

    // if (topNode.hasChild("init")) {
    // var initNode=topNode.getChild("init");
    if (topNode.hasChild("script")) {
        initScript=topNode.getChild("script").get("innerValue");
    }

    if (!initScript) throw "no performance setup data supplied";

    with (userspace.space) {
        userspace.space.eval(initScript);
    }



    if (topNode.hasChild("score")) {
        var scoreNode=topNode.getChild("score");
        if (scoreNode.hasChild("script")) {
            score=scoreNode.getChild("script").get("innerValue");
        }
    } else throw "the composition document has no <score> section";


    userspace.space.runScoreTest(score);
    
    
    

    

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
            dfs.eachClient(function (client) {
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
                ;
            });
            
            if (ready) {
                userspace.space.eachRole(function(role){
                    userspace.space.runScore(score,role.name);
                });

            }
        }, countIn);

    };



 /*   */

};


function fromXML (packageDirectory) {
    if (performance) {
        if (performance.running) {
            throw "cannot reload XML while running";
        } else {
            performance.reset();
        }
    } else new Performance();
    var xmldoc;
    try {
        var xmlFile = path.join(packageDirectory, "composition.xml");
        var contents = fs.readFileSync(xmlFile, "UTF8").replace("\n", "");
    } catch (error) {
        throw "could not read the XML file: "+error;
    }
    try {
        xmldoc = DOM.parseFromString(contents, "text/html");
    } catch (error) {
        throw "the XML file is invalid: "+error;
    }

    var loaders={
        composition:function(){
            var composition=xmldoc.getElementsByTagName("composition");
            var node=new XMLNode(composition[0]);
            new Performance(node.getData());
        },
        roles:function() {
            var readroles=xmldoc.getElementsByTagName("role");
            for (var key in readroles) {
                var node=new XMLNode(readroles[key]);
                new Role(node.get("name"),node.getData());
            }
        },
        events:function() {
            var readevents = xmldoc.getElementsByTagName("event");
            for (var key in readevents) {
                var node=new XMLNode(readevents[key]);
                var data=node.getData();
                switch (data.type) {
                    case "text":
                        new TextEvent(data.name,data.innerValue);
                        break;
                    case "html":
                        new HtmlEvent(data.name,node.inner());
                        break;
                    case "score":
                        new ScoreEvent(data.name,node.innerValue);
                        break;
                    case "image":
                        new ImageEvent(data.name,node.innerValue);
                        break;
                    case "script":
                        new ScriptEvent(data.name,node.innerValue);
                        break;
                }

            }
        },

        introduction:function(){
            var intro=xmldoc.getElementsByTagName("introduction");
            var node=new XMLNode(intro[0]);
            performance.introductionText=node.get("innerValue"); // as text not html
        },
        listeners:function(){

        },
        triggers:function(){

        }

    };

};



function XMLEventParser(xmlNode){
    var data=xmlNode.getData();
    var pre,post;

    function _while() {
        var stmt="while (";
        if (data.var) {
            stmt+=data.var;
        } else if (data.const) {
            if ((typeof data.const==="number") || (typeof data.const==="boolean")) { // bool?>??
                stmt+=data.const;
            } else {
                stmt+='"'+data.const+'"';
            }
        }

    }

    switch (xmlNode.name) {
        case "perform":
            break;
        case "while":

            break;
        case "if":
            break;
        case "for":
            break;
        case "foreach":
            break;

        default:
            throw "unrecognised part in events";
    }


};




module.exports=DFML2Document;
