var path = require("path");
var fs = require("fs");
var DOMParser = require("xmldom").DOMParser;
var Performance = require("./performance.js");
var Role = require("./role.js");
var dfs = require("./dfs.js");
var Timing = require("./timing.js");
var XMLNode = require("./xmlNode.js");
var DisplayEvent = require("./displayEvent.js");



module.exports = function (packageDir) {
    var self = this;
    var packageDir = path.join(process.cwd(), "dfsPackages", packageDir); // change to config val
    var DOM = new DOMParser();
    this.error = [];
    var ready = true;
    var xmlDoc;
    this.performance = new Performance();
    try {
        // try to load and parse the XML file
        var xmlFile = path.join(packageDir, "composition.xml");
        var contents = fs.readFileSync(xmlFile, "UTF8").replace("\n", "");
        xmlDoc = DOM.parseFromString(contents, "text/html");
    } catch (errorDetail) {
        self.error.push("Could not load or parse the XML file: " + errorDetail);
        dfs.log.warn(self.error);
        return;
    }
    self.performance.dir=packageDir;

    /**
     * objects for loading/parsing particular sections of the XML file
     * into the Performance object
     */
    var loaders = {
        /**
         * load the roles
         * @param {DOMNode} xmlDoc the xml node
         * @returns {undefined}
         */
        readRoles: function (xmlDoc) {
            var out = {};

            var pNode = xmlDoc.getElementsByTagName("role");
            for (var perf in pNode) {
                if (pNode[perf].nodeType !== 1) {
                    break;
                }
                var role = new Role(new XMLNode(pNode[perf]));
                out[role.id] = role;
                console.log(out);
            }

            //var node = new XMLNode(performers);
            //Log.Debug("loadperf");
            //node.EachChild(function (child) {
            //
            //});
            self.performance.roles=out;
        },
        /**
         * load the meta tags
         * @param {DOMNode} xmlDoc the xml node
         * @returns {undefined}
         */
        readMeta: function (xmlDoc) {
            var meta = xmlDoc.getElementsByTagName("composition");
            var node = new XMLNode(meta[0]);
            self.performance.meta=
                node.getData(["duration", "composer", "title", "tempo"]);
        },
        readIntroduction:function(xmlDoc) {
            var intro=xmlDoc.getElementsByTagName("introduction");
            if (intro.length>0) {
                var node=new XMLNode(intro[0]);
                self.performance.introductionText=node.get("innerValue");
            }
        },
        /**
         * load css styles
         * @param {DOMNode} xmlDoc the xml node
         * @returns {undefined}
         */
        readStyles: function (xmlDoc) {
            var styles = xmlDoc.getElementsByTagName("style");
            if (styles.length > 0) {
                for (var style in styles) {
                    if (styles[style].nodeType !== 1) {
                        break;
                    }
                    var node = new XMLNode(styles[style]);
                    self.performance.addStyle(node.get("innerValue"));
                }
            }
        },
        readPreambles:function(xmlDoc) {
            var ambles=xmlDoc.getElementsByTagName("preamble");
            for (var amble in ambles) {
                var node=new XMLNode(ambles[amble]);
                self.roleCall(node.get("role"), "setPreamble", node.get("innerValue"));
            }
        },
        /**
         * load and setup the listeners, depends on performers
         * @param {DOMNode} xmlDoc the xml node
         * @returns {undefined}
         */
        readListeners: function (xmlDoc) {
            var listeners = xmlDoc.getElementsByTagName("listeners");
            var node = new XMLNode(listeners);
            node.eachChild(function (child) {
                var role = child.get("role");
                self.roleCall(role, "addListener", child);
            });
        },
        /**
         * load triggers, depends on listeners
         * @param {DOMNode} xmlDoc the xml node
         * @returns {undefined}
         */
        readTriggers: function (xmlDoc) {
            var triggers = xmlDoc.getElementsByTagName("triggers");
            var node = new XMLNode(triggers);
            node.eachChild(function (child) {
                var role = child.Get("role");
                self.roleCall(role, "addTrigger", child);
            });
        },
        /**
         * read, test and set init scripts
         * @param {DOMNode} xmlDoc the xml node
         * @returns {undefined}
         */
        readScript: function (xmlDoc) {
            //return;
            var scripts = xmlDoc.getElementsByTagName("initScript");
            for (var script in scripts) {
                var node = new XMLNode(scripts[script]);
                var role = node.get("role");
                if (node.get("innerValue")) {
                    try {
                        self.roleCall(role, "addInit", node.get("innerValue"));
                        delete test;
                    } catch (errors) {
                        self.error.push("initScript parsing failed: " + errors);
                    }
                }

            }

        },
        /**
         * read the actual events
         * @param {DOMNode} xmlDoc the xml node
         * @returns {undefined}
         */
        readEvents: function (xmlDoc) {
            try {
            var events = xmlDoc.getElementsByTagName("events");
            var root = new XMLNode(events[0]);
            var loader = self.iterateEvents(root);
            self.performance.events=loader.events;
            } catch (errors) {
                error.push("event loading failed: "+errors);
            }

        }
    }; // end of loaders

    /**
     * assign data to all or a specific Performer
     * @param {string} role the role name
     * @param {string} call the method name
     * @param {object} node the data to pass
     * @returns {Array}
     */
    this.roleCall = function (roles, call, node) {
        dfs.log.debug("in rolecall " + roles);
        var addRoles = [];
        if (roles) {
            self.splitRole(roles, function (roleName) {
                if (self.performance.hasRole(roleName)) {
                    var thisRole = self.performance.getRole(roleName);
                    thisRole[call](node);
                    addRoles.push(thisRole.id);
                } else {
                    self.error.push(roleName+" has not been defined ("+call + " failed)");
                }
            });
        } else {
            self.performance.eachRole(function (role) {
                role[call](node);
                addRoles.push(role.id);
            });
        }
        dfs.log.debug("exit rolecall");
        return addRoles;
    };



    this.iterateEvents=function(root) {
        var instance = this;
        this.events = {};
        this.id = dfs.uid();
        this.timer = null;
        var count = 0;

        this.indexEvent = function (evn, roles) {
            var eventToAdd = {event: evn, roles: roles};
            instance.events[count] = eventToAdd;
            count++;
        };


        root.eachChild(function (node) {
            switch (node.tagName()) {
                case "event":
                    var rl = null;
                    if (node.get("role")) {
                        rl = node.get("role");
                    }
                    var ev = new DisplayEvent(node);//iterself.MakeEvent(node);
                    var addedRoles = self.roleCall(rl, "addEvent", ev);
                    instance.indexEvent(ev, addedRoles);
                    break;
                case "timegroup":
                    instance.timer = new Timing(node);
                    var result = new self.iterateEvents(node);
                    instance.indexEvent({"timegroup": instance.timer, "events": result.events}, null);
                    //[count]={"event":{"timegroup":timer,events:evs},roles:null};
                    // console.log(masterEvents[count]);


                    dfs.log.debug("timegroup");
                    break;
                case "loop":
                    instance.timer = new Timing(node);
                    var result = new self.iterateEvents(node);
                    instance.indexEvent({"loop": instance.timer, "events": result.events}, null);
                    break;
            }
            ;

        });

        return instance;

    };


    this.splitRole = function (roleString, callback) {
        var items = roleString.split(",");
        for (var item in items) {
            callback(items[item]);
        }
        ;
    };

    this.timeDetect=function(input) {
        var duration=self.performance.meta.duration;
        var tempo=self.performance.meta.tempo;
        var t2=input.slice(-2);
        var t1=t2.slice(-1);
        var val=input.slice(input.length-2);
        switch (t2) {
            case "ms":
                return val;
                break;
            case "bt":
                return (60/tempo)*val;
                break;
            case "br":
                break;
        }
        val=val.slice(val.length-1);
        switch (t1) {
            case "s":
                return val*1000;
            case "%":
                return (100/duration)*val;
                break;

        }
    }

    this.timeInterpret=function(input,format) {
        switch (format) {
            case "hh:mm:ss":
                break;
            case "percent":
                break;
            case "milliseconds":
                break;
            case "beats":
                break;
            case "bars":
                break;
        }
    };


    /**
     * run through the loaders
     */
    for (var index in loaders) {
        try {
        dfs.log.debug("parsing stage: " + index);
        loaders[index](xmlDoc);
        } catch (errorDetail) {
            //Log.Debug("loader error");
            self.error.push("Could not load "+index+": " + errorDetail);
            ready = false;
        }
    }
};