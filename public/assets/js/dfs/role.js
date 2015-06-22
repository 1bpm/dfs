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
            self.runEvent(request);
        },

        performanceStart:function(request) {
            if (!dfs.roleAssigned) return;
            view.state("performanceStart",{countIn:request.countIn});
            dfs.emit("performanceStart",{acknowledged:true});
        }

    };


    this.runEvent=function(request) {
        console.log(request);
        if (!self.events[request.id]) {
            dfs.log.warn("event does not exist in cache "+request.id);
        } else {
            setTimeout(function(){
                dfs.emit("eventAcknowledged",{id:request.id,tid:request.tid});
            },0);

            view.id("performanceProgressBar").stop();
            view.id("performanceProgressBar").css("width","0%");

            if (self.currentEvent) {
                if (self.currentEvent.stop) self.currentEvent.stop();
                delete self.currentEvent;
            }

            if (self.events[request.id]) {
                self.currentEvent = self.events[request.id].main;
                //console.log(self.currentEvent);
                if (request.mini) {
                    self.events[request.id].main.miniEvent = self.events[request.mini].mini;
                }

                self.events[request.id].main.run(function () {
                    dfs.emit("eventComplete", {id: request.id,tid:request.tid});
                }, request.duration-10);
            } else {
                dfs.log.warn("event could not be run: "+request.id);
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
