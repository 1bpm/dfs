var osc=require("node-osc");
var config=require("../config");

var routing={   
    
};

var oscServer=new osc.Server(3333,config.listenAddress);
oscServer.on("message",function(msg,info){
    var route=msg[1][0].split("/");
    var val=msg[1][3]; // or [4] ???
    if (route[0] in routing) {
        routing[route[0]](route,val);
    }
});

