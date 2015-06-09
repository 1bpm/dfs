var dfs=require("./dfs.js");
var performance;
var despatchList={};

var EventDespatcher=function(thePerformance) {
    performance=thePerformance;
    performance.eachRole(function(role){
        despatchList[role.id]=[];
    });
    var potentialDuration=performance.meta.duration;
    var duration=isNaN(potentialDuration) ? null : potentialDuration;
    console.log(performance.events);
    new EventFlattener(performance.events,duration);

    this.begin=function(){
        performance.eachRole(function(role){
            new RoleDespatcher(role);
        });
    }
};


var RoleDespatcher=function(role) {
    var self=this;
    var current=0;
    var events=despatchList[role.id];
    console.log(events);
    //setTimeout(function(){

    //},0);
    this.next=function() {
        dfs.log.debug("ev"+current);
        var event,next;
        try {
            event=events[current];
        } catch(e) {
            event=null;
        }
        try {
            next=events[current+1].id;
        } catch(e) {
            next=null;
        }
        current++;
        if (event)
            role.runEvent(event.id,event.duration,next);
        if (next) {
            setTimeout(function(){
                self.next();
            },event.duration);
        } else if ((current+1)>=events.length) {
            role.eachClient(function(client) {
                if (!client.superuser) {
                    client.view("loading", {title: "Performance complete", text: "Awaiting conductor"});
                } else {
                    client.view("loading", {title: "Performance complete", text: "Please wait"});
                    setTimeout(function(){
                        client.superuser.listPackages();
                    },3000);

                }
            });
        }

    };
    self.next();
};



var EventFlattener=function(events,timeout,roleOverride,lengthOverride) {
    var self=this;
    var runningLength={};
    performance.eachRole(function(role){
        runningLength[role.id]=0;
    });



    this.timegroupProcess=function(item) {
        this.roleAssign(item,function(role){
            var length;
            if (lengthOverride) {
                length=lengthOverride;
            } else {
                length=item.event.timegroup.getDuration();
            }
            runningLength[role]+=length;

            if (timeout && runningLength[role]>timeout) {
                length=length-(timeout-runningLength[role]);
            }
            if (length>0) {
                new EventFlattener(item.event.events,length,item.roles,length);
            }
        });
    };

    this.loopProcess=function(item) {
        //this.RoleAssign(item,function(role){
        var length;
        console.log(item);
        if (lengthOverride) {
            length=lengthOverride;
        } else {
            length=item.event.loop.getDuration();
        }


        //if a timeout is imposed from parent, check and limit the current duration
        //if (timeout && runningLength[role]>timeout) {
        //    length=length-(timeout-runningLength[role]);
        //}

        if (length>0) {
            var roleTimes=new EventFlattener(item.event.events,length,item.roles);
            performance.eachRole(function(role){
                runningLength[role]+=roleTimes[role];
                if (runningLength[role]<length) {
                    self.loopProcess(item);
                }
            });

        }
        //});
    };

    this.roleAssign=function(item,callback) {
        if (!item.roles || item.roles.duration<1) {
            if (roleOverride) {
                for (var key in roleOverride) {
                    callback(roleOverride[key]);
                }
            } else {
                performance.eachRole(function(role) {
                    callback(role.id);
                });
            }
        } else {
            for (var key in item.roles) {
                callback(item.roles[key]);
            }
        }

    };

    this.eventProcess=function(item,lengthOverride) {
        this.roleAssign(item,function(role){
            var duration;
            if (lengthOverride) {
                duration=lengthOverride;
            } else {
                duration=item.event.timing.getDuration();
            }
            runningLength[role]+=duration;
            // if a timeout is imposed from parent, check and limit the current duration
            if (timeout && runningLength[role]>timeout) {
                duration=duration-(timeout-runningLength[role]);
            }
            if (duration>0) {
                despatchList[role].push({id:item.event.id,duration:duration});
            }
        });


    };

    for (var key in events) {
        var thisItem=events[key];
        console.log(thisItem);
        if (thisItem) {
            if (thisItem.hasOwnProperty("event") && thisItem.event.hasOwnProperty("timegroup")) {
                self.timegroupProcess(thisItem);
            } else if (thisItem.hasOwnProperty("event") && thisItem.event.hasOwnProperty("loop")) {
                self.loopProcess(thisItem);
            } else if (thisItem.hasOwnProperty("event")) {
                self.eventProcess(thisItem,lengthOverride);
            } else {
                dfs.log.warn("event group has no events");
            }
        }
    }
    return runningLength;

};


module.exports=EventDespatcher;