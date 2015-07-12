
var Event = function (inData,displaySpace) {
    if (!displaySpace) displaySpace="";
    
    var displayEvents = {
        text: function (data) {
            this.data = data;
            this.html = function () {
                var scale=1200/window.screen.width;
                var classes="textDisplayEvent";
                if (data.class) classes+=" "+data.class;
                var params={class:classes};
                var txtLen=data.content.length;
                var fontSize=128;
                if (txtLen>=50) fontSize=40;
                if (txtLen<45) fontSize=50;
                if (txtLen<40) fontSize=60;
                if (txtLen<35) fontSize=70;
                if (txtLen<30) fontSize=80;
                if (txtLen<25) fontSize=100;
                if (txtLen<20) fontSize=120;
                if (txtLen<15) fontSize=180;
                if (txtLen<10) fontSize=230;
                if (txtLen<5) fontSize=300;
                var ht=$("<div />",params)
                        .css("font-size",Math.floor(fontSize)+"px")
                        .text(data.content);
                return ht;
            };
        },
        image: function (data) {
            this.data = data;

            this.html = function () {
                var classes="imageDisplayEvent";
                if (data.class) classes+=" "+data.class;
                
                var ht=$("<div />",{
                    class:classes
                }).css("background-image","url('/assets/performance/"+data.content+"')");
                return ht;
            };
            
            this.preScript = function (context) {
                view.id("performance").show();
                context.show();
                context.hide(); 
                if (!dfs.live) view.id("performance"+displaySpace).hide();
            };
        },
        html: function (data) {
            this.data = data;
            this.html = function () {
                return data.content;
            };
        },
        script: function (data) {
            this.data = data;
            var identifier=data.displayArea+data.name+displaySpace;
            this.getScript = function () {
                var scriptRun = "var context=$('#innerScript" + identifier + "'); " + data.content[1];
                return scriptRun;
            };
            
            this.preScript=function(context) {
                if (!data.content[0]) return;
                var scriptRun = "var context=$('#innerScript" + identifier + "'); " + data.content[0];
                eval(scriptRun);
            };

            this.html = function () {
                var ht=$("<div />",{
                    class:"scriptEvent",
                    id:"innerScript"+identifier
                });
                return ht;
            };

        },
        score: function (data) {
            this.data = data;
            var identifier=data.displayArea + data.name+displaySpace;
            var tabdiv;
            this.html = function () {
                var classes="vexScore vex-tabdiv";
                if (data.class) classes+=" "+data.class;
                
                var ht=$("<div />",{
                    id:"scEv"+identifier,
                    class:classes
                }).text(data.content);
                var htVal = '<div width="800" height="768" scale="1" id="scEv' + identifier + '" class="vexScore vex-tabdiv">' + data.content + '</div>';
                return htVal;
                // return ht.html();
            };
            this.preScript = function (context) {
                tabdiv = Vex.Flow.TabDiv.prototype.init("#scEv" + identifier);
            };
        },
        canvas: function (data) {
            this.data = data;

        }
    };





    var BaseDisplayEvent = function (theEvent) {
        var self = this;
        this.event = theEvent.data;
        this.id = self.event.name;
        this.bpm = (self.event.tempo) ? self.event.tempo : 60;
        var runningFunction = null;
        var complete = false;
        this.ready = false;
        var length = 0;
        this.div = null;
        this.throbStart=null;
        this.miniEvent = null;


        this.setup = function () {
            if (self.event.setup) {
                self.event.setup();
            }
            self.addToDisplayArea();
        };


        this.html = function () {
            return self.event.html();
        };

        this.getDiv = function () {
            return $(self.div);
        };


        this.throb = function (duration) {
            var main = (self.event.displayArea === "main") ? true : false;
            var throbStartTime = duration * 0.25;
            var beatDuration = ((60 / self.bpm) * 1000);
            var beats=4;
            var fadeTime = beatDuration * 0.6;
            if (fadeTime>250) fadeTime=250;
            var currentBeat = 1;
            if (!main) { // mini event throbbing, beats back from duration         
                for (beats = 4; beats > 0; beats--) {
                    if (beats!==3) {
                    var test = (duration - (beatDuration * beats)); // when to start preview flash
                    if (test > duration * 0.4) { // if start is more than 0.4 of event
                        self.throbStart=throbStartTime = test;
                        break;
                    }
                }
                }
            } else { // main event flash, 
                if (self.miniEvent && self.miniEvent.throbStart) {
                    var alignTempoBy=self.miniEvent.throbStart;
                    var nextBpm=self.miniEvent.bpm;
                }
                self.throbStart=throbStartTime=0;
                beats=duration/beatDuration;
                if (nextBpm) {
                    var timeRatio=(nextBpm<self.bpm)?
                        (nextBpm-self.bpm)/alignTempoBy:
                        (self.bpm-nextBpm)/alignTempoBy;
                }
                
            }
            var current=throbStartTime;
            var synced=false;
            function doThrob() {
                
                // main event before preview flash
                if (main && alignTempoBy && current<alignTempoBy) {
                    var rat=current*timeRatio;
                    beatDuration=(nextBpm>=self.bpm)?
                        1000*(60/(self.bpm-rat)):    // testy testy
                        1000*(60/(self.bpm+rat));
                
                    // adjust the last beat
                    if (current+beatDuration>=alignTempoBy) {
                        synced=true;
                        beatDuration=alignTempoBy-current;
                    }                
                
                // if for some reason the main flash goes over into the preview flash
                } else if (main && alignTempoBy && current>=alignTempoBy) {
                    beatDuration = ((60 / nextBpm) * 1000);
                    if (!synced) {
                        synced=true;
                        beatDuration-=alignTempoBy-current;
                    } // shouldn't get to this
                    
                // is mini event, or bpm is the same as next bpm    
                } else { 
                    beatDuration = ((60 / self.bpm) * 1000);
                }

                view.id(theEvent.data.displayArea + "Throb"+displaySpace).css("opacity","0.7").show().fadeOut(fadeTime);
                
                if (current+beatDuration < duration) {
                    realTimeout(doThrob, beatDuration);
                    current+=beatDuration;
                    currentBeat++;
                }
            }
            
            realTimeout(doThrob, throbStartTime);
        };

        this.run = function (completeFunction, durationOverride) {
            var duration = 5000;
            if (durationOverride) {
                duration = durationOverride;
            } else {
                try {
                    duration = self.event.duration;
                } catch (error) {
                    dfs.log.warn("failed setting event duration " + self.id);
                }
            }

            if (completeFunction)
                realTimeout(function(){
                  //  self.stop();
                    completeFunction();
                }, duration);
            
            
            
            

            if (self.event.showNextEvent && self.miniEvent) {
                view.id("miniDisplay"+displaySpace).show();
                self.miniEvent.miniEvent=null;
                self.miniEvent.getDiv().show();
                self.miniEvent.runScript(duration);
                if (self.event.throbNext) {
                    self.miniEvent.throb(duration);
                }          
            } else {
                view.id("miniDisplay"+displaySpace).hide();
            }
            
            if (self.event.throb) self.throb(duration);

            if (self.runScript) self.runScript(duration);
            self.getDiv().show();
            
            var dfsSpecial=(self.event.name.substr(0,4)==="_dfs")?true:false;
            

            if (self.event.eventCounter 
                    && dfs.eventNum<=dfs.eventTotal 
                    && !dfsSpecial) {
                view.id("counterDisplay"+displaySpace).text(dfs.eventNum+"/"+dfs.eventTotal).show();
            } else {
                view.id("counterDisplay"+displaySpace).hide();
            }
            
            if (dfsSpecial && self.event.progressBar) {
                view.id("performanceProgressBar"+displaySpace).css("background-color","red");
            } else {
                view.id("performanceProgressBar"+displaySpace).css("background-color","#000000");
            }

            if (self.event.progressBar) {
                view.id("performanceProgressBar"+displaySpace).show().animate({
                    width: "100%"
                }, duration, "linear", function () {
                    // completeFunction used to be here
                });
            } else {
                view.id("performanceProgressBar"+displaySpace).hide();
            }




        };

        this.runScript = function (duration) {
            if (!duration) duration=5000;
            if (self.runningFunction) {
                clearTimeout(self.runningFunction);
                delete self.runningFunction;

            } 
            if (theEvent.getScript) {
                try {
                    self.runningFunction = setTimeout(function () {
                        eval("var duration="+(duration-30)+";"+theEvent.getScript());
                    }, 0);
                } catch (e) {
                    dfs.log.warn("cannot exec script");
                }
            } else {
                // no script
            }
        };

        this.stop = function () {
            if (self.runningFunction) {
                clearTimeout(self.runningFunction);
                delete self.runningFunction;

            }

            self.getDiv().hide();
            if (self.miniEvent) {
                self.miniEvent.getDiv().hide();

                //self.miniEvent.stop();
            }



        };


        this.addToDisplayArea = function () {
            //  try {
            var dispArea = theEvent.data.displayArea;

            var displayArea;
            switch (dispArea) {
                case "main":
                    displayArea = "#mainDisplay"+displaySpace;
                    break;
                case "mini":
                    displayArea = "#miniDisplayInner"+displaySpace;
                    break;
                case "aux":
                    displayArea = "#auxDisplay"+displaySpace;
                    break;
                default:
                    displayArea = "#mainDisplay"+displaySpace;
            }
            var innerEvent=$("<div />", {
                class: dispArea + "Event event",
                id: "event" + dispArea + self.id + displaySpace
            }).append(theEvent.html());
            console.log(theEvent.html());
                    
            $(displayArea).append(innerEvent);

            //    '<div class="' + dispArea
            //   + 'Event" id="event' + dispArea + self.id + '">' + theEvent.html() + '</div>');

            self.div = "#event" + dispArea + self.id+displaySpace;
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

    var DisplayEvent = function (input, displayArea) {
        var base;
        var evData = input;//.data;
        evData.name = input.name;
        //data.id="mini"+data.id;
        if (evData.type in displayEvents) {
            evData.displayArea = displayArea;
            base = new BaseDisplayEvent(new displayEvents[evData.type](evData));

        } else {
            dfs.log.warn("unknown " + displayArea + " event type: " + evData.type);
        }
        if (base) {
            base.setup();
            return base;
        }
    };


    return {
        mini: new DisplayEvent(JSON.parse(JSON.stringify(inData)), "mini"),
        main: new DisplayEvent(inData, "main")
    };
};









