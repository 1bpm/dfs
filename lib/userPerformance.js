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
    performed: [],
    Future: require("fibers/future"),
    Fiber: require("fibers"),
    live: false,
    document: null,
    dfs: require("./dfs.js") // hak
};

this.setDoc = function (doc) {
    _system.document = doc;
};

var dftool = {
    resource: function (name) {
        if (!_system.document)
            return;
        var path = require("path");
        var contents;
        var thePath = path.join(_system.document.packageDirectory, name);
        try {
            contents = require(thePath);
            return contents;
        } catch (e) {
            // not node requirable
        }
        try {
            var fs = require("fs");
            contents = fs.readFileSync(thePath);
            return contents.toString();
        } catch (e) {
            throw "dftool.resource cannot load " + name;
        }

    },
    beats: function (beats, bpm) {
        if (!bpm) {
            if (performance && performance.tempo) {
                bpm = performance.tempo;
            } else {
                bpm = 60;
            }
        }
        return (beats * (60 / bpm));
    },
    s: function (seconds) {
        return seconds * 1000;
    },
    round: function (input) {
        return Math.floor(input);
    },
    rand: function (arg1, arg2) {
        if (!arg1 && !arg2) {
            if (Math.random() > 0.5) {
                return true;
            } else {
                return false;
            }
        }
        if (!arg2 && arg1 instanceof Array) {
            return arg1[Math.floor(Math.random() * arg1.length)];
        }
        if (!arg2 && arg1 instanceof Object) {
            var keys = Object.keys(arg1);
            var choice = keys[Math.floor(Math.random() * keys.length)];
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
        if (key && key.UPPERCASE in dftool.notes)// tbc
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


function perform(theRoles, event, duration) {
    if (!event || !theRoles || isNaN(duration))
        throw "missing parameters for perform call";
    theRoles = (typeof theRoles === "array" || typeof theRoles === "object") ? theRoles : [theRoles];
    duration = Math.floor(duration);
    for (var name in theRoles) {
        (function (role, event, duration) {
            var role = (role instanceof Role) ? role : roles[role];
            var event = (event instanceof Event) ? event : events[event];
            if (!role) {
                return;
                //console.log(roles);
                //throw "event perform for non-existent role "+role;
            }

            if (!_system.live) {
                role.totalEvents += 1;
            } else {
                if (_system.Fiber.current.role !== role)
                    return;



                if (event) { // cache it out
                    role.eachPerformer(function (client) {
                        var evs = {};
                        evs[event.name] = event;
                        client.emit("eventCache", {events: evs});
                    });
                }

                var currentEvent = (_system.Fiber.current.nextEvent) ? _system.Fiber.current.nextEvent : null;
                var nextEvent = _system.Fiber.current.nextEvent = {event: event, duration: duration};
                if (currentEvent && nextEvent) {
                    var toPerform = {
                        role: role, // pass the whole role obj
                        main: {
                            name: currentEvent.event,
                            duration: currentEvent.duration
                        },
                        mini: {
                            name: nextEvent.event,
                            duration: nextEvent.duration //just in case we might need it....
                        }
                    };

                    _system.Fiber.current.perform(toPerform);
                    _system.performed.push({
                        performanceTime: performance.time,
                        roleTime: role.performanceTime,
                        call: {
                            role: role.name,
                            main: {name: currentEvent.event.name, duration: currentEvent.duration},
                            mini: {name: nextEvent.event.name, duration: nextEvent.duration}
                        }});
                    toPerform.role = role.name;
                    for (var o in observers)
                        observers[o].perform(toPerform);
                } else {
                    // no current or next
                }
            }
            role.performanceTime += duration;
        })(theRoles[name], event, duration);
    }
}

function global(arg1, arg2) {
    if (!_system.live) {
        if (typeof arg1 === "function") {
            arg1();
        } else if (arg1 && arg2) {
            performance.globals[arg1] = arg2;
            return arg2;
        } else if (arg1 && !arg2 && performance.globals.hasOwnProperty(arg1)) {
            return performance.globals[arg1];
        }
    } else {
        if (arg1 && typeof arg1 !== "function" && performance.globals.hasOwnProperty(arg1)) {
            return performance.globals[arg1];
        }
    }
}


var Performance = function (data) {
    if (_system.live)
        return;
    data = (data || {});
    var composer = (data.hasOwnProperty("composer")) ? data.composer : "Unknown composer";
    var title = (data.hasOwnProperty("title")) ? data.title : "Untitled composition";
    var tempo = (data.hasOwnProperty("tempo")) ? data.tempo : 60;
    var duration = (data.hasOwnProperty("composer")) ? data.duration : null;
    var startTime;
    var time;
    var styles = (data.styles || []);
    var introductionText;
    var running = false;
    var maxRoleTime = 0;
    var showNextEvent = (data.hasOwnProperty("showNextEvent")) ? data.showNextEvent : true;
    var throbNext = (data.hasOwnProperty("throbNext")) ? data.throbNext : true;
    var eventCounter = (data.hasOwnProperty("eventCounter")) ? data.eventCounter : true;
    var throb = (data.hasOwnProperty("throb")) ? data.throb : false;
    var progressBar = (data.hasOwnProperty("progressBar")) ? data.progressBar : true;
    var loop = (data.loop || false);
    this.globals = {};
    Object.defineProperties(this, {
        composer: {
            enumerable: true,
            get: function () {
                return composer;
            },
            set: function (v) {
            }
        },
        maxRoleTime: {
            enumerable: true,
            get: function () {
                return maxRoleTime;
            },
            set: function (v) {
                maxRoleTime = v;
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
        loop: {
            enumerable: true,
            get: function () {
                return loop;
            },
            set: function (v) {
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
                return tempo;
            },
            set: function (v) {
                if (!isNaN(v))
                    tempo = v;
            }
        },
        time: {
            enumerable: true,
            get: function () {
                if (!running) {
                    return 0;
                } else {
                    var t = process.hrtime(startTime);
                    return parseFloat(t[0] + "." + t[1]) * 1000;
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
        showNextEvent: {
            enumerable: true,
            get: function () {
                return showNextEvent;
            },
            set: function () {
            }
        },
        progressBar: {
            enumerable: true,
            get: function () {
                return progressBar;
            },
            set: function (v) {
                progressBar = v;
            }
        },
        eventCounter: {
            enumerable: true,
            get: function () {
                return eventCounter;
            },
            set: function (v) {
                eventCounter = v;
            }
        },
        throb: {
            enumerable: true,
            get: function () {
                return throb;
            },
            set: function (v) {
                throb = v;
            }
        },
        throbNext: {
            enumerable: true,
            get: function () {
                return throbNext;
            },
            set: function (v) {
                throbNext = v;
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
                running = v;
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

    _userspace.reset();
    performance = this;

    // make all named clients (those logged in) eligible for performance
    _system.dfs.eachClient(function (client) {
        if (client.name) {
            client.role = null;
            new Performer(client);
        }
    });

    this.start = function () {
        running = true;
        startTime = process.hrtime();
        if (duration && !isNaN(duration)) {
            setTimeout(function () {
                running = false;
            }, duration);
        }
    };
};



this.runScoreTest = function (score, roleName) {
    _system.live = false;
    var maxTime = 0;
    eval(score);
    for (var roleName in roles) {
        if (roles[roleName].performanceTime > maxTime)
            maxTime = roles[roleName].performanceTime;
        if (roleName !== "perform") {
            roles[roleName].reset();
        }

    }
    performance.maxRoleTime = maxTime;
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
    _system.scoreTest = false;
    roles[roleName].performanceTime = 0;
    performance.start();
    //if (performance.loop && performance.duration)
    //  score = "while (performance.running) { " + score + "}";

    if (roleName !== "perform") {
        _system.Future.task(function () {
            _system.Fiber.current.role = roles[roleName];
            _system.Fiber.current.sleep = function (ms) {
                var fiber = _system.Fiber.current;
                setTimeout(function () {
                    fiber.run();
                }, ms);
                _system.Fiber.yield();
            };

            _system.Fiber.current.perform = function (data, override) {
                if (!override && data.role.name !== roleName)
                    return;
                //performer output
                data.role.performedEvents.push(data.role.currentEvent);
                data.role.eachPerformer(function (performer) {
                    performer.perform(data.main.name, Math.floor(data.main.duration), data.mini.name);
                });
                _system.Fiber.current.sleep(Math.floor(data.main.duration));

            };

            //var end = ';roles["' + roleName + '"].perform(,6000);';

            eval(score); // user score    
            var ender = new TextEvent("End of performance", {
                throbNext: false,
                throb: false,
                progressBar: false,
                showNextEvent: false,
                eventCounter: false
            }, "_dfsPerformanceFinished");
            perform(roleName, ender, 500);
            perform(roleName, ender, 500);

            roles[roleName].performanceComplete = true;
            _userspace.complete();

        }).detach(); // 'thread' for each role
    }


};

this.complete = function () {
    var p = true;
    this.eachRole(function (role) {
        if (!role.performanceComplete)
            p = false;
    });
    if (!p)
        return;
    this.eachRole(function (role) {
        role.eachPerformer(function (performer) {
            if (performer.superuser)
                performer.performanceComplete();
        });
    });
    var recording = {
        time: {
            date: new Date().toISOString(),
            system: process.hrtime()
        },
        schedule: _system.performed,
        roles: roles,
        events: events,
        triggers: triggers,
        listeners: listeners,
        observers: observers,
        performance: performance
    };
    
    var recordingPath=require("path").join(_system.document.packageDirectory, "recording.json");
    require("fs").writeFileSync(
            recordingPath,
            JSON.stringify(recording));
            
    //require('dns').resolve("dfscore.com", function (err) {
    //    if (!err) {
    //        // post it back home for analysis
    //    }
    //});
};
// reset/clear the performance
this.reset = function () {
    if (_system.live) {
        this.eachRole(function (role) {
            role.eachPerformer(function (performer) {
                performer.performanceComplete();
            });
        });
    }
    _system.live = false;
    performance = null;
    _system.performed = [];
    events = {};
    roles = {};
//    roles = {
//        perform: function (event, duration) {
//            if (_system.live) {
//                _system.Fiber.current.role.perform(event, duration);
//
//            } else {
//                for (var role in roles) {
//                    if (role!=="perform") roles[role].perform(event, duration);
//                }
//            }
//        }
//    };
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
        performanceReady: {
            enumerable: true,
            get: function () {
                return client.performanceReady;
            },
            set: function () {
            }
        },
        superuser: {
            enumerable: true,
            get: function () {
                if (client.superuser) {
                    return true;
                } else {
                    return false;
                }
            },
            set: function () {
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
//        latency: {
//            enumerable: true,
//            get: function () {
//                return client.getLatency();
//            },
//            set: function () {
//            }
//        },
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
    this.reset = function () {
        client.performedEvents = {};
        client.performanceReady = false;
    };
    this.performanceComplete = function () {
        client.role = null;
        if (!client.superuser) {
            //  client.view("loading", {title: "Performance complete", text: "Awaiting conductor"});
            //  client.emit("performanceComplete", {});
        } else {
            client.view("loading", {title: "Performance complete", text: "Please wait"});
            client.emit("performanceComplete", {});
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
            var toSend = {
                title: performance.title,
                composer: performance.composer,
                time: performance.maxRoleTime,
                meta: {
                    duration: performance.duration,
                    tempo: performance.tempo
                },
                roles: roles,
                intro: performance.introductionText
            };
            client.view("performanceAvailable",
                    toSend);
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
    if (_system.live)
        return roles[roleName];
    var self = this;
    data = (data || {});
    var name = roleName;
    if (!name)
        name = "Role " + (Object.keys(roles).length + 1);
    var key = (data.hasOwnProperty("key")) ? data.key : null;
    var instrument = (data.hasOwnProperty("instrument")) ? data.instrument : null;
    var clef = (data.hasOwnProperty("clef")) ? data.clef : null;
    var preamble = (data.hasOwnProperty("preamble")) ? data.preamble : null;
    var performanceTime = 0;
    var maxPerformers = (data.hasOwnProperty("maxPerformers")) ? data.maxPerformers : 1;
    var roleMembers = {};
    var currentEvent = {};
    var nextEvent = {};
    var performedEvents = [];
    var totalEvents = 0;
    var ready = false;
    Object.defineProperties(this, {
        performanceTime: {
            enumerable: true,
            get: function () {
                return performanceTime;
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
            }
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
                return maxPerformers;
            },
            set: function () {
            }

        },
        totalEvents: {
            enumerable: true,
            get: function () {
                return totalEvents;
            },
            set: function (v) {
                totalEvents = v;
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
        delete currentEvent, nextEvent;
        nextEvent = {}, currentEvent = {};
    };
    /**
     * threaded one step read ahead technique
     * @param event
     */
    this.perform = function (event, duration) {
        var thisEvent = (typeof event === "string") ? events[event] : event;
        if (!_system.live && thisEvent && !isNaN(duration))
            performanceTime += Math.floor(duration);
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

            }
        } else {
            totalEvents += 1;
        }
        return self;
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

        if (!performer.superuser) {
        }
        for (var perf in performers) {
            //if (performers[perf].superuser)
            performers[perf].set();
        }
        performer.reset();
        performer.emit("view", {state: "performanceReady", data: {events: events, role: self, performance: performance}});
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
    return roles[name];
};
this.eachRole = function (callback) {
    for (var rolen in roles) {
        if (rolen !== "perform")
            callback(roles[rolen]);
    }
};
var Event = function (data) {
    if (!performance)
        throw "attempting to create event with no performance";
    if (!data.content)
        throw "no event content";
    if (!data.type)
        throw "no event type";
    var self = this;
    var name = (data.name || "ev" + (Object.keys(events).length + 1));
    var type = data.type;
    var content = data.content;
    var tempo = (data.hasOwnProperty("tempo")) ? data.tempo : performance.tempo;
    var showNextEvent = (data.hasOwnProperty("showNextEvent")) ? data.tempo : performance.showNextEvent;
    var throbNext = (data.hasOwnProperty("throbNext")) ? data.tempo : performance.throbNext;
    var eventCounter = (data.hasOwnProperty("eventCounter")) ? data.tempo : performance.eventCounter;
    var throb = (data.hasOwnProperty("throb")) ? data.tempo : performance.throb;
    var progressBar = (data.hasOwnProperty("progressBar")) ? data.tempo : performance.progressBar;
    Object.defineProperties(this, {
        tempo: {
            enumerable: true,
            get: function () {
                return tempo;
            },
            set: function (v) {
                if (!isNaN(tempo))
                    tempo = v;
            }
        },
        progressBar: {
            enumerable: true,
            get: function () {
                return progressBar;
            },
            set: function (v) {
                if (typeof v === "boolean")
                    progressBar = v;
            }
        },
        eventCounter: {
            enumerable: true,
            get: function () {
                return eventCounter;
            },
            set: function (v) {
                if (typeof v === "boolean")
                    eventCounter = v;
            }
        },
        throb: {
            enumerable: true,
            get: function () {
                return throb;
            },
            set: function (v) {
                if (typeof v === "boolean")
                    throbMain = v;
            }
        },
        throbNext: {
            enumerable: true,
            get: function () {
                return throbNext;
            },
            set: function (v) {
                if (typeof v === "boolean")
                    throbNext = v;
            }
        },
        showNextEvent: {
            enumerable: true,
            get: function () {
                return showNextEvent;
            },
            set: function (v) {
                if (typeof v === "boolean")
                    showNextEvent = v;
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
    function syncEvents() {
        var ev = {};
        ev[self.name] = self;
        _userspace.eachRole(function (role) {
            role.eachPerformer(function (client) {
                client.emit("eventCache", {events: ev});
            });
        });
//            
//            _system.Fiber.current.role.eachPerformer(function (client) {
//                client.emit("eventCache",{events:ev});
//            });
    }




    events[name] = this;
    if (_system.live) {
        //syncEvents();
    }
};
function baseEvent(type, content, arg1, arg2) {
    var ev = {
        type: type,
        content: content,
        name: null
    };
    var params;
    if (arg1 && typeof (arg1) === "object") {
        params = arg1;
        if (arg2 && typeof (arg2) === "string")
            ev.name = arg2;
    } else if (arg1 && typeof (arg1) === "string") {
        ev.name = arg1;
        if (arg2 && typeof (arg2) === "object")
            params = arg2;
    }
    if (params)
        for (var p in params)
            ev[p] = params[p];
    return new Event(ev);
}

var HtmlEvent = function (theHtml, a1, a2) {
    return baseEvent("html", theHtml, a1, a2);
};
var TextEvent = function (theText, a1, a2) {
    return baseEvent("text", theText, a1, a2);
};
var ImageEvent = function (imageName, a1, a2) {
    return baseEvent("image", imageName, a1, a2);
};
var ScriptEvent = function (setupscript, runscript, a1, a2) {
    if (typeof setupscript === "function") {
        setupscript = "(" + setupscript.toString() + ")()";
    }
    if (typeof runscript === "function") {
        runscript = "(" + runscript.toString() + ")()";
    }

    return baseEvent("script", [setupscript, runscript], a1, a2);
};
var ScoreEvent = function (score, a1, a2) {
    var theScore;
    if (typeof score === "string") {
        theScore = score;
    } else if (score instanceof dftool.scoreBuilder) {
        theScore = score.toString();
    }
    return baseEvent("score", theScore, a1, a2);
};
var Trigger = function (name, listener, conditionFunc, callback) {
    var triggered = false;
    if (!name)
        name = "tr" + (Object.keys(triggers).length + 1);
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
        triggered: {
            enumerable: true,
            get: function () {
                if (triggered) {
                    triggered = false;
                    return true;
                } else {
                    return false;
                }
            },
            set: function (v) {

            }
        }
    });
    var submit = {name: name, data: data};
    if (!(listener instanceof Listener))
        throw "invalid listener provided";
    for (var perf in listener.performers) {
        listener.performers[perf].emit("newTrigger", submit);
    }

    var condition = function () {

    };
    triggers[name] = this;
};
var KeyboardListener = function (name, roleOrPerformer, key) {
    return new Listener(name, roleOrPerformer, {
        type: "key",
        key: key
    });
};
var MouseMoveListener = function (name, roleOrPerformer) {
    return new Listener(name, roleOrPerformer, {
        type: mouse
    });
};
var MouseClickListener = function (name, roleOrPerformer, button) {
    if (button)
        button = 1;
    return new Listener(name, roleOrPerformer, {
        type: "click",
        button: button
    });
};
var AudioListener = function (name, roleOrPerformer, method) {

    return new Listener(name, roleOrPerformer, {
        type: "audio",
        method: method
    });
};
var Listener = function (name, roleOrPerformer, data) {
    var value;
    var performerList = [];
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
    var submit = {name: name, data: data};
    if (roleOrPerformer instanceof Role) { //multiple performers
        role.eachPerformer(function (client) {
            performerList.push(client);
            client.emit("newListener", submit);
        });
    } else { // one performer
        performerList = [roleOrPerformer];
        roleOrPerformer.emit("newListener", submit);
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