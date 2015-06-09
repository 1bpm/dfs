

var Admin=function() {
    var self=this;
    this.inspector=null;

    var routes= {
        performanceLoaded: function (request) {
            self.performanceLoaded(request);
            //self.inspector = new Inspector();
        },
        listConnections: function (request) {
            view.tableBuilder(view.id("connectionList"), request.connections);
        },
        listActiveRoles: function (request) {
            view.tableBuilder(view.id("activeRoleList"), request.roles);
        },
        listPackages: function (request) {
            view.state("packageList", request);
        },
        parseErrors: function (data) {
            var txt = "";
            var cnt = 1;
            for (var item in data.errors) {
                txt += cnt + ". " + data.errors[item] + "<br>";
                cnt++;
            }
            view.sure(function () {},
                "Package errors <small> the composition could not be loaded</small>",
                txt, true);
        },
        objectState: function (data) {
            view.sure(function () {
                }, "Server state",
                "<textarea style='width:100%;height:200px'>"+data.dfs+"</textarea>", true);
        }
    };


    this.performanceLoaded=function(request) {
        view.state("suPerformanceReady",request);
        self.allEvents=request.allEvents;
    };


    this.routing=function(request) {
        console.log(request);
        if (request.route in routes) {
            routes[request.route](request);
        } else {
            dfs.log.warn("unknown admin route for " + request.route);
        }
    };

    this.emit = function (route,objectData) {
        try {
            objectData["route"]=route;
        } catch (error) {
            var objectData={"route":route};
        }
        dfs.emit("admin", {admin: objectData});
    };

};