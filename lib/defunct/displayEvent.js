var Timing=require("./timing.js");
var dfs=require("./dfs.js");

module.exports=function (xmlnode,noTiming) {
    var self=this;
    this.data = xmlnode.data;
    this.timing=null;
    this.id=dfs.uid(); //(xmlnode.get("id")) ? xmlnode.get("id") :
    if (!noTiming) self.timing=new Timing(xmlnode);

    var mapTypes=["html","text","script","score","image"];
    for (var map in mapTypes) {
        var val=mapTypes[map];
        if (xmlnode.hasChild(val)) {
           // console.log("AS"+xmlnode.GetChild("html").Inner());
            self.data[val]=xmlnode.getChild(val).inner();
        }
    }
};

