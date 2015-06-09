//"use strict";
var roles = {};
var events = {};
var triggers = {};
var listeners = {};
var performers = {};
var observers = {};
var performance;
var _userspace = this;

var _system = {
    Future: require("fibers/future"),
    Fiber: require("fibers"),
    live: true,
    dfs: require("./dfs.js") // hak
};

var dftool = {
    notes: require("./dffData/basenotes"),
    chords: require("./dffData/chords"),
    tuning: require("./dffData/tuning"),
    round: function (input) {
        return Math.floor(input);
    },
    rand: function (arg1, arg2) {
        if (!arg2 && arg1 instanceof Array) {
            return arg1[Math.floor(Math.random() * arg1.length)];
        }
        if (!arg2 && arg1 instanceof Object) {
            var keys=Object.keys(arg1);
            var choice=keys[Math.floor(Math.random()*keys.length)];
            return arg1[choice];
        }
        if (!arg2 && typeof arg1 === "number") {
            return Math.random() * arg1;
        }
        if (arg2 && typeof arg1 === "number" && typeof arg2 === "number") {
            return (Math.random() * (arg2 - arg1)) + arg1;
        }
    },
    scoreBuilder: function (key, time) {
        var vex = "stave\nnotation=true\n";
        if (key && key.UPPERCASE in dftool.notes)
            vex += "key=" + key + " ";
        if (time)
            vex += "time=" + time + "\n";

        this.addNotes = function (noteRow) {
            vex += "notes: " + noteRow + " |\n";
        };

        this.toString = function () {
            return vex;
        };

    }
};


var Performance = function (data) {
    var composer;
    var title;
    var tempo;
    var duration;
    var startTime;
    var time;
    var styles = [];
    var showMiniEvent = true;
    var introductionText;
    var running = false;
    var maxRoleTime=0;
    var constructable = ["composer", "title", "tempo", "duration", "styles", "showMiniEvent", "introductionText"];
    Object.defineProperties(this, {
        composer: {
            enumerable: true,
            get: function () {
                return composer;
            },
            set: function (v) {
            }
        },
        maxRoleTime:{
            enumerable:true,
            get:function(){
                return maxRoleTime;
            },
            set:function(v){
                maxRoleTime=v;
            }
        },
        title: {
            enumerable: true,
            get: function () {
                return title;
            },
            set: function () {
            }
        },
        duration: {
            enumerable: true,
            get: function () {
                return duration;
            },
            set: function (v) {
                duration = v;
            }
        },
        tempo: {
            enumerable: true,
            get: function () {
                return duration;
            },
            set: function (v) {
                duration = v;
            }
        },
        time: {
            enumerable: true,
            get: function () {
                if (!running) {
                    return 0;
                } else {
                    return process.hrtime() - startTime;
                }
            },
            set: function (val) {
            }
        },
        styles: {
            enumerable: true,
            get: function () {
                return styles;
            },
            set: function () {
            }
        },
        showMiniEvent: {
            enumerable: true,
            get: function () {
                return showMiniEvent;
            },
            set: function () {
            }
        },
        introductionText: {
            enumerable: true,
            get: function () {
                return introductionText;
            },
            set: function () {
            }
        },
        running: {
            enumerable: true,
            get: function () {
                return running;
            },
            set: function (v) {
                running=v;
            }
        }
    });


    // don't allow a performance to be interrupted if already running
    if (performance && performance.running)
        return;

    // construct checks
    if (data) {
        if (!data.composer)
            throw "a performance requires a composer name";
        if (!data.title)
            throw "a performance requires a title";
    } else
        throw "a new performance requires a composer and title";

    // set the arguments if listed in constructable
    if (constructable)
        for (var key in constructable)
            if (data[constructable[key]])
                eval(constructable[key] + "= data[constructable[key]]");
    _userspace.reset();
    performance = this;

    // make all named clients (those logged in) eligible for performance
    _system.dfs.eachClient(function (client) {
        if (client.name)
            client.role=null;
            new Performer(client);
    });

    this.start=function(){
        running=true;
        startTime=process.hrtime();
    };
};



this.runScoreTest = function (score,roleName) {
    _system.live = false;
    maxTime=0;
    eval(score);
    for (var roleName in roles) {
        if (roles[roleName].performanceTime>maxTime) 
            maxTime=roles[roleName].performanceTime;
        if (roleName !== "perform") {
            roles[roleName].reset();
        }
        
    }
    performance.maxRoleTime=maxTime;
    for (var perf in performers) {
        performers[perf].set();
    }
};

/**
 * set the performance live, create and detach a thread for a given role
 * @param score the score body script
 * @param roleName the name of the role to despatch events for
 */
this.runScore = function (score, roleName) {
    _system.live = true;
    performance.start();
    if (roleName !== "perform") {
        _system.Future.task(function () {
            _system.Fiber.current.role=roleName;
            _system.Fiber.current.sleep = function (ms) {
                var fiber = _system.Fiber.current;
                console.log("insleep");
                setTimeout(function () {
                    fiber.run();
                }, ms);
                _system.Fiber.yield();  
            };

            _system.Fiber.current.perform = function (data,override) {
                if (!override && data.role.name !== roleName) return;
                //performer output
                data.role.performedEvents.push(data.role.currentEvent);
                data.role.eachPerformer(function (performer) {
                    performer.perform(data.main.name, Math.floor(data.main.duration), data.mini.name);
                });
                _system.Fiber.current.sleep(Math.floor(data.main.duration));
                
            };
            
           //var end = ';roles["' + roleName + '"].perform(,6000);';
            eval(score); // user score    
            new TextEvent("_dfsPerformanceFinished","End of performance");
            roles[roleName].perform("_dfsPerformanceFinished",100);
            roles[roleName].perform("_dfsPerformanceFinished",100);
            
            
            roles[roleName].eachPerformer(function (performer) {
                performer.performanceComplete();
            });

        }).detach(); // 'thread' for each role
    }

};



// reset/clear the performance
this.reset = function () {
    events = {};
    roles = {
    
    };
    performers = {};
    triggers = {};
    listeners = {};
    observers = {};
    performers = {};
};


this.eval = function (script) {
    var _userspaceCall = true;
    eval(script);
};



this.newPerformer = function (client) {
    return new Performer(client);
};



var Observer = function (theClient) {
    var client = theClient;
    var ip = client.ip;

    if (!client)
        throw "an observer cannot be created without a connection";

    Object.defineProperties(this, {
        name: {
            enumerable: true,
            get: function () {
                return name;
            },
            set: function (v) {
                client.name = v;
            }
        },
        ip: {
            enumerable: true,
            get: function () {
                return ip;
            },
            set: function () {
            }
        },
        latency: {
            enumerable: true,
            get: function () {
                return client.getLatency();
            },
            set: function () {
            }
        }
    });

    this.emit = function (route, data, callback) {
        client.emit(route, data, callback);
    };


    this.perform = function (current, duration, next) {
        client.emit("runEvent", {id: current, mini: next, duration: duration});
        var stamp = new Date().getTime();
        client.performedEvents[current + stamp] = {name: current, duration: duration, completed: false, confirmed: false, stamp: stamp};
        setTimeout(function () {
            if (client.performedEvents[current + stamp].confirmed !== true) {
                _system.dfs.log.warn("observer acknowledgement delayed by more than 50ms");
            }
        }, 50);
    };


};



var Performer = function (theClient) {
    var self = this;
    var client = theClient;
    var name = client.name;
    var ip = client.ip;


    Object.defineProperties(this, {
        name: {
            enumerable: true,
            get: function () {
                return name;
            },
            set: function (v) {
                client.name = v;
            }
        },
        ip: {
            enumerable: true,
            get: function () {
                return ip;
            },
            set: function () {
            }
        },
        latency: {
            enumerable: true,
            get: function () {
                return client.getLatency();
            },
            set: function () {
            }
        },
        performedEvents: {
            enumerable: true,
            get: function () {
                return client.performedEvents;
            },
            set: function () {
            }
        }

    });

    if (!client)
        throw "a performer cannot be created without a connection";
    if (!name)
        throw "a performer must have a name";


    this.emit = function (route, data, callback) {
        client.emit(route, data, callback);
    };

    this.performanceComplete = function () {
        client.role=null;
        if (!client.superuser) {
            client.view("loading", {title: "Performance complete", text: "Awaiting conductor"});
        } else {
            client.view("loading", {title: "Performance complete", text: "Please wait"});
            setTimeout(function () {
                client.superuser.listPackages();
            }, 3000);

        }
    };


    this.perform = function (current, duration, next) {
        if (next)
            next = next.name;
        if (!current)
            return;
        current = current.name;
        console.log("runEvent called");
        var stamp = new Date().getTime();
        var tid = current + stamp;
        client.performedEvents[tid] = {name: current, duration: duration, completed: false, confirmed: false, stamp: stamp};

        client.emit("runEvent", {id: current, mini: next, duration: duration, tid: tid});

        setTimeout(function () {
            if (client.performedEvents[tid].confirmed !== true) {
                _system.dfs.log.warn("event acknowledgement delayed by more than 50ms");
            }
        }, 50);
    };

    this.eval = function (data) {

    };

    this.set = function () {
        if (performance) {
            client.view("performanceAvailable",
                    {
                        title: performance.title,
                        composer: performance.composer,
                        time:performance.maxRoleTime,
                        meta: {
                            duration: performance.duration,
                            tempo: performance.tempo                       
                        },
                        roles: roles,
                        intro: performance.introductionText
                    });
        } else {
            client.view("loading", {
                title: "Awaiting conductor",
                text: "Please wait while the conductor sets up the current performance"
            });
        }

    };

    performers[name] = this;
    this.set();

};

/**
 * create a new role
 * @param roleName a mandatory identifier for the role
 * @param data an object of optional key/values defining the role
 * @constructor
 */
var Role = function (roleName, data) {
    var self = this;
    var name = roleName;
    var key;
    var instrument;
    var clef;
    var preamble;
    var performanceTime=0;
    var maxPerformers = 1;
    var roleMembers = {};
    var currentEvent = {};
    var nextEvent = {};
    var performedEvents = [];
    var totalEvents = 0;
    var ready = false;
    var constructable = ["instrument", "key", "clef", "preamble", "maxPerformers"];
    if (!name) name="Role "+(roles.length+1);

    Object.defineProperties(this, {
        performanceTime:{
            enumerable:true,
            get:function(){
                return performanceTime;
            },
            set:function(v){
            }
        },
        name: {
            enumerable: true,
            get: function () {
                return name;
            },
            set: function (v) {
            }
        },
        key: {
            enumerable: true,
            get: function () {
                return key;
            },
            set: function (v) {
            }
        },
        instrument: {
            enumerable: true,
            get: function () {
                return instrument;
            },
            set: function (v) {
            }
        },
        clef: {
            enumerable: true,
            get: function () {
                return clef;
            },
            set: function () {
            },
        },
        performedEvents: {
            enumerable: true,
            get: function () {
                return performedEvents;
            },
            set: function () {
            }
        },
        preamble: {
            enumerable: true,
            get: function () {
                return preamble;
            },
            set: function () {
            }
        },
        maxPerformers: {
            enumerable: true,
            get: function () {
                return maxPerformers
            },
            set: function () {
            }
        },
        totalEvents: {
            enumerable: true,
            get: function () {
                return totalEvents
            },
            set: function (v) {
                totalEvents = v
            }
        },
        assignable: {
            enumerable: true,
            get: function () {
                if (roleMembers && Object.keys(roleMembers).length >= maxPerformers) {
                    return false;
                } else {
                    return true;
                }
            },
            set: function () {
            }
        },
        roleMembers: {
            enumerable: true,
            get: function () {
                return roleMembers;
            },
            set: function () {
            }
        },
        ready: {
            enumerable: true,
            get: function () {
                return ready;
            },
            set: function (v) {
                ready = v;
            }
        }
    });





    this.reset = function () {
        nextEvent = {}, currentEvent = {};
    };


    /**
     * threaded one step read ahead technique
     * @param event
     */
    this.perform = function (event, duration) {
        var thisEvent = (typeof event === "string") ? events[event] : event;

        if (!_system.live && thisEvent && !isNaN(duration)) performanceTime += Math.floor(duration);

        if (_system.live) {
            currentEvent = nextEvent;
            nextEvent = {event: thisEvent, duration: duration};

            if (currentEvent && nextEvent) {

                _system.Fiber.current.perform({
                    role: self, // pass the whole role obj                    
                    main: {
                        name: currentEvent.event,
                        duration: currentEvent.duration
                    },
                    mini: {
                        name: nextEvent.event,
                        duration: nextEvent.duration //just in case we might need it....
                    }
                });

            } else {
                console.log("no cur nex");
            }
        } else {
            totalEvents += 1;
        }
    };

    /**
     * execute a callback for each performer
     * @param callback the callback function. each performer object is passed as the sole argument
     */
    this.eachPerformer = function (callback) {
        for (var performer in roleMembers) {
            callback(roleMembers[performer]);
        }
    };

    this.addClient = function (client) {
        self.addPerformer(new Performer(client));
    };

    this.addPerformer = function (performer) {
        if (performer in roleMembers) {
            throw "performer already exists in role";
        } else {
            roleMembers[performer.name] = performer;
            //performer.emit("eventCache", events);
        }

        for (var perf in performers)
            performers[perf].set();

        performer.emit("view", {state: "performanceReady", data: {events: events, role: this, performance: performance}});
        ready = false;
    };

    this.removePerformer = function (performer) {
        for (var roleKey in roleMembers) {
            var role = roleMembers[roleKey];
            if (role === performer) {
                roleMembers.splice(role, 1);
            }
        }
    };


    /**
     * send out one event if specified or send out all events to the performers
     * @param oneEvent
     * @private
     */
    this._syncEvents = function (oneEvent) {
        self.eachPerformer(function (performer) {
            performer._emit("eventCache", (oneEvent) ? oneEvent : events);
        });
    };

    if (data && constructable)
        for (var key in constructable)
            if (data[constructable[key]])
                eval(constructable[key] + "= data[constructable[key]]");


    //setupAccess(access,this);
    roles[name] = this;
    // if the construct is called and there are already events, ie that the role was created dynamically cache them on performers
    if (events)
        self._syncEvents();
};


this._sync = function (oneEvent) {
    this.eachPerformer(function (performer) {
        performer._emit("eventCache", (oneEvent) ? oneEvent : events);
    });
};

this.getRole = function (name) {
    return roles[name];hami
};

this.eachRole = function (callback) {
    console.log(roles);
    for (var rolen in roles) {
        if (rolen !== "perform")
            callback(roles[rolen]);
    }
};

var Event = function (data) {
    var self = this;
    var name = data.name;
    var type = data.type;
    var constructable = ["content"];
    var content;
    if (!name) name="ev"+(events.length+1);

    Object.defineProperties(this, {
        name: {
            enumerable: true,
            get: function () {
                return name;
            },
            set: function (v) {
            }
        },
        content: {
            enumerable: true,
            get: function () {
                return content;
            },
            set: function () {
            }
        },
        type: {
            enumerable: true,
            get: function () {
                return type;
            },
            set: function () {

            }
        }
    });


    if (!type)
        throw "an event requires a type";
    if (constructable)
        for (var key in constructable)
            if (data[constructable[key]])
                this[constructable[key]] = data[constructable[key]];



    function syncEvents() {
        _userspace.eachRole(function(role){
            role.eachPerformer(function (client) {
                var ev={};
                ev[self.name]=self;
                client.emit("eventCache", {events: ev});
            });
        });
    }


    if (constructable)
        for (var key in constructable)
            if (data[constructable[key]])
                eval(constructable[key] + "= data[constructable[key]]");
    events[name] = this;
    if (_system.live) syncEvents();
};

var HtmlEvent = function (eventName, theHtml) {
    return new Event({
        name: eventName,
        type: "html",
        content: theHtml
    });
};
var TextEvent = function (eventName, theText) {
    return new Event({
        name: eventName,
        type: "text",
        content: theText
    });
};
var ImageEvent = function (eventName, imageName) {
    return new Event({
        name: eventName,
        type: "image",
        content: imageName
    });
};
var ScriptEvent = function (eventName, script) {
    var theScript;
    if (typeof script === "string") {
        theScript = script;
    } else if (typeof script === "function") {
        theScript = script.toString();
    }
    return new Event({
        name: eventName,
        type: "script",
        content: script
    });
};
var ScoreEvent = function (eventName, score) {
    var theScore;
    if (typeof score === "string") {
        theScore = score;
    } else if (score instanceof dftool.scoreBuilder) {
        theScore = score.toString();
    }
    return new Event({
        name: eventName,
        type: "score",
        content: theScore
    });
};


var Trigger = function (name, listener, conditionFunc, callback) {
    var triggered=false;

    if (!name) name="tr"+(triggers.length+1);
    if (!listener)
        throw "a trigger requires a listener to be bound to";


    Object.defineProperties(this, {
        listener: {
            enumerable: true,
            get: function () {
                return listener;
            },
            set: function (v) {
            }
        },
        name: {
            enumerable: true,
            get: function () {
                return name;
            },
            set: function (v) {
            }
        },
        triggered:{
            enumerable:true,
            get:function() {
                if (triggered) {
                    triggered=false;
                    return true;
                } else {
                    return false;
                }
            },
            set:function(v) {

            }
        }
    });

    var submit={name: name,data:data};
    if (!(listener instanceof Listener)) throw "invalid listener provided";
    for (var perf in listener.performers) {
        listener.performers[perf].emit("newTrigger", submit);
    }

    var condition=function(){

    };

    triggers[name] = this;
};


var KeyboardListener=function(name,roleOrPerformer,key){
    return new Listener(name,roleOrPerformer,{
        type:"key",
        key:key
    });
};

var MouseMoveListener=function(name,roleOrPerformer) {
    return new Listener(name,roleOrPerformer,{
        type:mouse
    });
};

var MouseClickListener=function(name,roleOrPerformer,button) {
    if (button) button=1;
    return new Listener(name,roleOrPerformer,{
        type:"click",
        button:button
    });
};

var AudioListener=function(name,roleOrPerformer,method) {

    return new Listener(name,roleOrPerformer,{
        type:"audio",
        method:method
    });
};


var Listener = function (name, roleOrPerformer, data) {
    var value;
    var performerList=[];
    Object.defineProperties(this, {
        name: {
            enumerable: true,
            get: function () {
                return name;
            },
            set: function (v) {
            }
        },
        performers: {
            enumerable: true,
            get: function () {
                return performerList;
            },
            set: function () {
            }
        },
        value: {
            enumerable: true,
            get: function () {
                return value;
            },
            set: function () {

            }
        }
    });

    var submit={name: name,data:data};
    if (roleOrPerformer instanceof Role) { //multiple performers
        role.eachPerformer(function (client) {
            performerList.push(client);
            client.emit("newListener", submit);
        });
    } else { // one performer
        performerList=[roleOrPerformer];
        roleOrPerformer.emit("newListener", submit)
    }
};





module.exports = {
    space: this,
    performance: performance,
    roles: roles,
    events: events,
    triggers: triggers,
    listeners: listeners,
    performers: performers
};