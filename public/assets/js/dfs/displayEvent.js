var Event=function(inData) {
    var displayEvents={
        text:function(data){
            this.data=data;
            this.html=function() {
                var ht="<div class='textDisplayEvent'";
                if (data.style) {
                    ht=ht.concat("style='"+data.style+"'>");
                } else {
                    ht=ht.concat(">");
                }
                ht=ht.concat(data.innerValue + "</div>");
                return ht;
            };
        },
        image:function(data){
            this.data=data;

            this.html=function() {
                var ht='<div style="margin-left:auto;background-position:center;margin-right:auto;width:100%;height:100%;background-repeat:no-repeat;background-image:url(\''+data.innerValue+'\')"';
                if (data.style) {
                    ht=ht.concat(" style='"+data.style+"'>");
                } else {
                    ht=ht.concat(">");
                }
                ht=ht.concat("</div>");
                return ht;
            };
        },
        html:function(data) {
            this.data=data;
            this.html=function() {
                return data.html;
            };
        },
        script:function(data) {
            this.data=data;

            this.getScript=function() {
                var scriptRun="var context=$('#innerScript"+data.displayArea+data.id+"'); "+data.innerValue;
                return scriptRun;
            };

            this.html=function() {
                return '<div class="scriptEvent" id="innerScript'+data.displayArea+data.id+'"></div>';
            };

        },
        score:function (data) {
            this.data=data;
            var tabdiv;
            this.html=function() {
                //var htVal='<canvas id="scEv'+data.id+'"></canvas>';
                var htVal='<div width="800" height="768" scale="1" id="scEv'+data.displayArea+data.id+'" class="vexScore vex-tabdiv">'+data.innerValue+'</div>';
                return htVal;
            };
            this.preScript=function(context) {
                console.log("score prescript "+data.displayArea+data.id);
                tabdiv=Vex.Flow.TabDiv.prototype.init("#scEv"+data.displayArea+data.id);
            };
        },
        canvas:function(data) {
            this.data=data;

        }
    };





    var BaseDisplayEvent=function(theEvent) {
        var self=this;
        this.event=theEvent.data;
        this.id=self.event.id;
        var runningFunction=null;
        var complete=false;
        this.ready=false;
        var length=0;
        this.div=null;
        this.miniEvent=null;


        this.setup=function() {
            if (self.event.setup) {
                self.event.setup();
            }
            self.addToDisplayArea();
        };


        this.html=function() {
            return self.event.html();
        };

        this.getDiv=function() {
            return $(self.div);
        };

        this.run=function(completeFunction,durationOverride) {
            var duration=5000;
            if (durationOverride) {
                duration=durationOverride;
            } else {
                try {
                    duration = self.event.duration;
                } catch (error) {
                    dfs.log.warn("failed setting event duration "+self.id);
                }
            }
            //setTimeout(function(){
            //   instance.stop();
            //    Log.Debug("event end "+id);
            //    complete=true;
            //},duration-5);

            //setTimeout(function() {

            self.getDiv().show();
            self.runScript();
            if (self.miniEvent) {
                self.miniEvent.getDiv().show();
                self.miniEvent.runScript();
            }


            view.id("performanceProgressBar").animate({
                width : "100%"
            },duration,"linear",function() {
                if (completeFunction) completeFunction(self);
                dfs.log.debug("event animation complete"+self.id);
            });






        };

        this.runScript=function() {
            if (theEvent.getScript) {
                console.log(theEvent.getScript());
                try {
                    self.runningFunction=setTimeout(function(){
                        eval(theEvent.getScript());
                    },0);
                } catch (e) {
                    dfs.log.warn("cannot exec script");
                }
            } else {
                console.log("noscript "+theEvent.data.displayArea+" "+self.id);
            }
        };

        this.stop=function() {
            self.getDiv().hide();
            if (self.miniEvent) {
                self.miniEvent.getDiv().hide();

                //self.miniEvent.stop();
            }

            if (self.runningFunction) {
                clearTimeout(self.runningFunction);
                delete self.runningFunction;

            }

        };


        this.addToDisplayArea=function() {
          //  try {
                var dispArea = theEvent.data.displayArea;

                var displayArea;
                switch (dispArea) {
                    case "main":
                        displayArea = "#mainDisplay";
                        break;
                    case "mini":
                        displayArea = "#miniDisplayInner";
                        break;
                    case "aux":
                        displayArea = "#auxDisplay";
                        break;
                    default:
                        displayArea = "#mainDisplay";
                }
                $(displayArea).append('<div class="' + dispArea
                    + 'Event" id="event' + dispArea + self.id + '">' + theEvent.html() + '</div>');

                self.div = "#event" + dispArea + self.id;
                self.stop();
                if (theEvent.preScript) {
                    theEvent.preScript(self.getDiv());
                }
                self.ready = true;
           // } catch (error) {
           //     dfs.log.warn("could not add display event "+self.id);
           // }
        };

    };

    var DisplayEvent=function(input,displayArea) {
        var base;
        var evData=input.data;
        evData.id=input.id;
        //data.id="mini"+data.id;
        if (evData.type in displayEvents) {
            evData.displayArea=displayArea;
            base=new BaseDisplayEvent(new displayEvents[evData.type](evData));

        } else {
            dfs.log.warn("unknown "+displayArea+" event type: "+evData.type);
        }
        if (base) {
            base.setup();
            return base;
        }
    };


    return {
        main:new DisplayEvent(JSON.parse(JSON.stringify(inData)),"mini"),
        mini:new DisplayEvent(inData,"main")
    };
};









