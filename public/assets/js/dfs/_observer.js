

var Observer=function(){
    var self=this;
    var roles={};
    
    this.setup=function(theRoles) {
        roles=theRoles;
        var nMax=2,nCur=1;
        var width=(1/nMax)*100+"%";
        var root=$("<div />",{
            class:"container"
        });
        for (var k in roles) {
            var role=roles[k];
            var div=$("<div />",{
                id:"observeRole-"+role
            });
            if (nCur>=nMax) {
                nCur=1;
            } else {
                nCur++;
            }
        }
        view.id("observe").empty().append(root);
    };
    
    this.observeEvent=function(data){
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
    }
};
