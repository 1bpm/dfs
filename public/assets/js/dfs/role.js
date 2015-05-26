var Role=function(objData) {
    var self=this;
    this.id=null;
    this.role;
    this.instrument;
    this.key;
    this.clef;
    this.events={};
    this.triggers={};
    this.listeners={};
    this.initScript=null;
    this.currentEvent=null;
    var fields=[
        "id","role","instrument","key","clef","triggers","listeners","initScript"
    ];

    for (var evID in objData.events) {
        var item=objData.events[evID];
        try {
            console.log("create event "+item.id);
            item.id=evID;
            self.events[item.id]=new Event(item);
        } catch (error) {
            dfs.log.warn("error creating event: "+error);
        }
    }

    for (var field in fields) {
        try {
            self[fields[field]]=objData[fields[field]];
        } catch (error) {
            dfs.log.warn("count not set role "+fields[field]+" data: "+error);
        }
    }

    if (objData["initScript"]) {
        try {
            $.globalEval(objData["initScript"]);
            //runFunc=eval(initScript);
            //runFunc();
        } catch (error) {
            dfs.log.warn("Could not parse role initScript");
        }
    }

    var routes={
        newEvent:function(request) {
            self.events[request.id]=new Event(request.eventData);
        },
        runEvent:function(request) {
            self.runEvent(request.id,request.mini,request.duration);
        },

        performanceStart:function(request) {
            view.state("performanceStart",{countIn:request.countIn});
            dfs.emit("performanceStart",{acknowledged:true});
        }

    };

    this.runEvent=function(id,miniId,duration) {
        if (!self.events[id]) {
            dfs.log.warn("event does not exist in cache "+id);
        } else {
            setTimeout(function(){
                dfs.emit("eventAcknowledged",{id:id});
            },0);

            view.id("performanceProgressBar").stop();
            view.id("performanceProgressBar").css("width","0%");

            if (self.currentEvent) {
                if (self.currentEvent.stop) self.currentEvent.stop();
                delete self.currentEvent;
            }

            if (self.events[id]) {
                self.currentEvent = self.events[id].main;
                //console.log(self.currentEvent);
                if (miniId) {
                    self.events[id].main.miniEvent = self.events[miniId].mini;
                }

                self.events[id].main.run(function () {
                    dfs.emit("eventComplete", {id: id});
                }, duration);
            } else {
                dfs.log.warn("event could not be run: "+id);
            }
        }
    };

    this.routing=function(request) {

        if (request.route in routes) {
            routes[request.route](request);
        } else {
            dfs.log.warn("unknown performance route for " + request.route);
        }
    };



};
