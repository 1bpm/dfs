var Observer=function(){
    var self=this;
    this.events={};
    this.roles={};
    this.duration=null;
    /**
     * Incoming message routing
     * @type {{performance: Function, performanceStatistics: Function, overviewClientStatistics: Function, overviewCallEvent: Function}}
     */
    var routes={
        /**
         * Events and role data
         * @param request
         */
        performance: function (request) {
            self.duration=this.duration;
            for (var roleKey in request.roles) {
                var role=request.role[roleKey];
                self.events[role.id]={};
                for (var ev in role.events) {
                    try {
                        self.events[role.id][event.id] =
                            new InspectorEvent(role.events[ev]);
                    } catch (error) {
                        dfs.log.warn("error creating inspector event: "+error);
                    }
                }
            }
        },
        performanceStatistics: function (request) {
            if (request.progress) {

            }
        },
        /**
         * Client statistics
         * @param request
         */
        overviewClientStatistics: function (request) {
            var cliEl = "role" + request.role;
            view.id(cliEl + "LatencyAvg").text(request.latencyAvg);
            view.id(cliEl + "LatencyMax").text(request.latencyMax);
        },
        observeEvent:function(request){
            var id=data.main.name;
       
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
        /**
         * Run an event
         * @param request
         */
        overviewCallEvent: function (request) {
            var event=self.events[request.role][request.event];
            if (request.miniEvent) {
                event.setMiniEvent(request.miniEvent);
            }
            event.run();
            view.id("role"+request.role+"CounterDisplay").text(request.counter);
        }
    };

//    this.setupDisplayArea=function(name,width,height){
//        var container=$("<div />",{
//            id:"performance"+name,
//            class:"performance"
//        }).css("width",width+"px").css("height",height+"px");
//        var mainDisplay=$("<div />",{
//            id:"mainDisplay"+name,
//            class:"mainDisplay"
//        }).append($("<div />",{
//            id:"mainThrob"+name,
//            class:"mainThrob"
//        }));
//        container.append(mainDisplay);
//        var miniDisplay=$("<div />",{
//            id:"miniDisplay"+name,
//            class:"miniDisplay"
//        }).append($("<div />",{
//            id:"miniThrob"+name,
//            class:"miniThrob"
//        })).append($("<div />",{
//            id:"miniDisplayInner"+name,
//            class:"miniDisplayInner"
//        }));
//        container.append(miniDisplay);
//        container.append($("<div />",{
//            id:"counterDisplay"+name,
//            class:"counterDisplay"
//        }));
//        var progress=$("<div />",{
//            id:"progressContainer"+name,
//            class:"progressContainer"
//        }).append($("<div />",{
//            id:"performanceProgressBar"+name,
//            class:"performanceProgressBar"
//        }));
//        container.append(progress);
//        return container;
//    };

    /**
     * Prepare the overview div
     */
    this.setupOverview=function(){
        var data={role:[],current:[],next:[],details:[]};
        for (var role in self.roles) {
            var thisRole=self.roles[role];
            var roleRef="role"+role;
            var roleContainer=$("<div />",{id:roleRef+"Names"});
            $("<h4 />").text(thisRole.name).appendTo(roleContainer);
            for (var client in thisRole.clients) {
                $("<p />").text(thisRole.clients[client].name).appendTo(roleContainer);
            }
            data.role.push(roleContainer.html());
            data.current.push('<div id="'+roleRef+'Main"></div>');
            data.next.push('<div id="'+roleRef+'Mini"></div>');
            var details=$("<div />",{
                id:roleRef+"Details"
            });
            $("<h3 />",{id:roleRef+"CounterDisplay"}).text("0/0").
                appendTo(details);
            var hd='<h4>avg latency<small id="'+roleRef+'LatencyAvg"></small></h4>'+
                '<h4>max latency<small id="'+roleRef+'LatencyMax"></small></h4>';
            details.append(hd);
            data.details.push(details);
        }
        view.tableBuilder("eventOverview",data);
    };

    /**
     * Prepare the inspector div
     */
    this.setInspector=function() {
        var ratio=self.duration/100;
        view.id("inspectorDetail").empty();
        for (var role in self.events) {
            var row=$("<div />",{
                css:{width:"100%"}
            });
            var events=self.events[role];
            for (var ev in events) {
                var event=events[ev];
                var item=$("<p />", {
                    css: {
                        width: event.duration * ratio + "%",
                        display:"inline",
                        backgroundColor:"#9999FF"
                    }
                });
                item.text(event.id);
                row.append(item);
            }
            view.id("inspectorDetail").append(row);
        }
    };

    /**
     * Handle incoming messages
     * @param request the message object
     */
    this.routing=function(request) {
        if (request.route in routes) {
            routes[request.route](request);
        } else {
            dfs.log.warn("unknown inspector route for " + request.route);
        }
    };

    /**
     * Emit an object to the server
     * @param route the route name
     * @param objectData the request object
     */
    this.emit = function (route,objectData) {
        try {
            objectData["route"]=route;
        } catch (error) {
            objectData={"route":route};
        }
        dfs.emit("registerObserver", {inspector: objectData});
    };

    self.emit("register");
};