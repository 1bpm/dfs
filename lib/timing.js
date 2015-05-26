var dfs=require("./dfs.js");

module.exports=function(xmlnode) {
    var self=this;
    var ready=false;
    this.static=false;
    this.duration=0;
    this.server=false;
    var testLength=xmlnode.get("duration");

    if (isNaN(testLength)) {
        var lengthScript;
        if (xmlnode.hasChild("duration")) {
            var child=xmlnode.getChild("duration");
            lengthScript="function(){"+child.get("innerValue")+"}";
            console.log("has duration");
        } else {
            console.log("error with duration "+JSON.stringify(xmlnode));
            lengthScript="function(){ return 2000; }";
        }
        try {
            var test;
            eval("test="+lengthScript);
            delete test;
        } catch (errors) {
            dfs.log.warn("time script parsing error"+errors);
        }



        switch (testLength) {
            case "staticScript":
                try {
                    eval("var calc="+lengthScript+";duration=calc()");
                    self.server=true;
                    self.static=true;

                } catch (errors) {
                    dfs.log.warn("static time script execution error: "+errors);
                }
                break;

                self.duration=lengthScript;
            case "performerScript":
                self.server=false;
                self.static=false;
                break;
            case "conductorScript":
                self.server=true;
                self.static=false;
                break;
            case "script":
                self.server=true;
                self.static=false;
                break;
        }
    } else {
        self.static=true;
        self.duration=testLength;

    }

    this.getDuration=function(client) {
        var result;
        if (!self.duration) {
            self.static=true;
            self.duration=1001;
        }
        if (self.static) {
            result=Math.floor(self.duration);
        } else if (self.server) {
            var evalResult;
            eval("evalResult="+self.duration);
            result=Math.floor(duration);
        } else {
            if (client) {
                client.eval(self.duration,function(resultLength) {
                    result=Math.floor(resultLength);
                });
            } else {
                dfs.eachClient(function(client){
                    client.eval(self.duration,function(resultLength) {
                        result=Math.floor(resultLength);
                    });
                    return;
                });
            }

        }
        return result;
    };


    this.withDuration=function(callback,client) {
        callback(self.getDuration(client));
    };

};