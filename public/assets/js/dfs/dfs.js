JSON.parseObject=function(input) {
    return JSON.parse(input, function (key, value) {
        if (value && typeof value === "string"
            && value.substr(0,8) == "function") {
            var startBody = value.indexOf('{') + 1;
            var endBody = value.lastIndexOf('}');
            var startArgs = value.indexOf('(') + 1;
            var endArgs = value.indexOf(')');
            return new Function(value.substring(startArgs, endArgs),
                value.substring(startBody, endBody));
        }
        return value;
    });
};


var cookie={
    set:function(cvalue) {
        var d = new Date();
        d.setTime(d.getTime() + (7*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie ="dfsToken=" + cvalue + "; " + expires;
    },
    get:function() {
        var name ="dfsToken=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return null;
    }
};


var dfs={
    _idCounter:0,
    config:{},
    requestCache:{},
    role:null,
    performance:{meta:{},intro:null},
    superuser:null,
    websocket:null,
    init:function(){
        window.WebSocket = window.WebSocket || window.MozWebSocket;
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        view.state("init");
    },
    routes:{
        eventCache:function(request) {
            for (var evName in request.events) {
                    var item=request.events[evName];
                    try {
                        console.log("try cache "+evName);
                        if (dfs.events[evName]) {
                            dfs.events[evName].main.getDiv().remove();
                            dfs.events[evName].mini.getDiv().remove();
                        }
                        dfs.events[evName]=new Event(item);
                    } catch (error) {
                        dfs.log.warn("error creating event "+evName+": "+error);
                    }
                }
        },

        su:function(request){
            if (dfs.superuser && request.su) {
                dfs.superuser.routing(request.su)
            }
        },
        newSession:function(request) {
            cookie.set(request.token);

        },
        menu:function(request) {
            if (request.superuser) {
                dfs.superuser=new Admin();
            }
            if (request.name) {
                view.state("menu",request);
            }
        },
        view:function(request) {
            if (request.data) {
                view.state(request.state,request.data);
            } else {
                view.state(request.state);
            }
        },
        log:function(request) {
            dfs.log[request.level](request.text);
        },
        role:function(request) {
            if (dfs.role) {
                dfs.role.routing(request.role);
            }
        },
        performanceComplete:function(request){
            dfs.roleAssigned=false;
            dfs.role=null;
            dfs.events={};
            dfs.eventNum=0,dfs.eventTotal=0;
            view.id("mainDisplay").empty();
            view.id("counterDisplay").text("");
            view.id("miniDisplayInner").empty();
            view.id("prepareCount").css({
                width:"0%"
            });
        },
        performanceAvailable:function(request){
            if (request.view==="login") {
                view.id("anonymousObserver").show();
            } else if (!dfs.roleAssigned || dfs.superuser) {
                dfs.roleAssigned=true;
                view.state("performanceAvailable",request);
            }
        },
        test:function(request) {
            var tests={
                latency:function(request){
                    var out=request.testData.length;
                    dfs.emit("testLatency",{acknowledged:true,length:out});
                },
                audio:function(request){
                    var available=true;
                    if (!window.AudioContext) {
                        available=false;
                        if (request.fatalise)
                            dfs.log.fatal("this performance requires a browser with WebAudio capabilities")
                    }
                    dfs.emit("testAudio",{state:available});
                }
            };

        },
        eval:function (request) {
            var output;
            try {
                var runFunc = eval("output=" + request.code);
            } catch (error) {
                output = "could not eval " + request.id + ": " + error;
                dfs.log.warn(output);
            }
            dfs.emit("cache", {cacheID:request.id,result: output});
        },
        runEvent:function(request) {
            dfs.runEvent(request.id,request.mini,request.duration,request.tid);
        },
        performanceStart:function(request) {
            dfs.eventNum=0;
            view.state("performanceStart",{countIn:request.countIn});
            dfs.emit("performanceStart",{acknowledged:true});
        }


    },

    runEvent:function(id,miniId,duration,tid) {
        if (!dfs.events[id]) {
            dfs.log.warn("event does not exist in cache "+id);
        } else {
            setTimeout(function(){
                dfs.emit("eventAcknowledged",{id:id,tid:tid});
            },0);
            dfs.eventNum++;
            if (dfs.eventNum<=dfs.eventTotal) view.id("counterDisplay").text(dfs.eventNum+"/"+dfs.eventTotal);
            view.id("performanceProgressBar").stop();
            view.id("performanceProgressBar").css("width","0%");

            if (dfs.currentEvent) {
                if (dfs.currentEvent.stop) dfs.currentEvent.stop();
                delete dfs.currentEvent;
            }

            if (dfs.events[id]) {
                dfs.currentEvent = dfs.events[id].main;
                //console.log(self.currentEvent);
                if (miniId) {
                    dfs.events[id].main.miniEvent = dfs.events[miniId].mini;
                }

                dfs.events[id].main.run(function () {
                    dfs.emit("eventComplete", {id: id,tid:tid});
                }, duration);
            } else {
                dfs.log.warn("event could not be run: "+id);
            }
        }
    },
    log:{
        _write:function(level,text) {
            view.state("log",{level:level,text:text});
        },
        warn:function(text) {
            console.warn(text);
            this._write("warn",text);
        },
        error:function(text) {
            console.error(text);
            this._write("error",text);
        },
        debug:function(text) {
            console.log("debug: "+text);
            if (dfs.config.debug) this._write("debug",text);
        },
        notify:function(text) {
            console.log(text);
            this._write(text);
        },
        fatal:function(text,title) {
            console.error(text,title);
            view.state("fatal",{text:text,title:title});
        }
    },
    uid:function(){
        dfs._idCounter++;
        return "dfs"+dfs._idCounter;
    },
    volatileRouting:function(request) {
        dfs.routing(request,JSON.parseObject);
    },
    routing:function(request,parseFunc) {
        if (!parseFunc) parseFunc=JSON.parse;
        if (request.cacheID && dfs.requestCache[request.cacheID]) {
            dfs.requestCache[request.cacheID](parseFunc(request));
        } else if (request.route in dfs.routes) {
            dfs.routes[request.route](parseFunc(request));
        }
    },
    emit:function(route,data,callback){
        try {
            if (!data) {
                data = {route: route};
            } else {
                data.route = route;
            }
            if (callback) {
                var cacheID=dfs.uid();
                data.cacheID=cacheID;
                dfs.requestCache[cacheID]=callback;
            }
            dfs.websocket.send(JSON.stringify(data));
        } catch (error) {
            dfs.log.error("failed sending message: " + error, true);
        }
    },

    init:function(){
        view.state("init");
        $.getJSON("/config",function(data){
            dfs.config=data;
            dfs.initConnection();
        });
    },

    initConnection:function() {
        var sessionState= cookie.get();
        try {
            dfs.websocket = new WebSocket("ws://" + dfs.config.serverAddress + ":" + dfs.config.serverPort);
        } catch (error) {
            dfs.log.fatal("Failed setting up websocket connection: " + error, true);
        }

        dfs.websocket.onopen = function () {
            dfs.emit("register",{token:sessionState});
        };

        dfs.websocket.onerror = function (error) {
            dfs.log.fatal("Network connection failure");
        };

        dfs.websocket.onmessage = function (message) {
            dfs.log.debug("received message: " + message.data, true);
            var data = JSON.parse(message.data);
            if (data.route in dfs.routes) {
                dfs.routes[data.route](data);
            } else {
                dfs.log.warn("unknown handler type for " + data.route);
            }
        };
    }




};