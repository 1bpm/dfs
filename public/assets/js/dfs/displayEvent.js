var Event = function (inData) {
    var displayEvents = {
        text: function (data) {
            this.data = data;
            this.html = function () {
                var ht = "<div class='textDisplayEvent'";
                if (data.class) {
                    ht = ht.concat(" class='" + data.class + "'>");
                } else {
                    ht = ht.concat(">");
                }
                ht = ht.concat(data.content + "</div>");
                return ht;
            };
        },
        image: function (data) {
            this.data = data;

            this.html = function () {
                var ht = '<div style="margin-left:auto;background-position:center;' +
                        'margin-right:auto;width:100%;height:100%;background-repeat:no-repeat;' +
                        'background-image:url(\'/assets/performance/' + data.content + '\')"';
                if (data.class) {
                    ht = ht.concat(" class='" + data.class + "'>");
                } else {
                    ht = ht.concat(">");
                }
                ht = ht.concat("</div>");
                return ht;
            };
            this.preScript = function (context) {
                view.id("performance").show();
                context.show();
                context.hide();
                if (!dfs.live) view.id("performance").hide();
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

            this.getScript = function () {
                var scriptRun = "var context=$('#innerScript" + data.displayArea + data.name + "'); " + data.content[1];
                return scriptRun;
            };
            
            this.preScript=function(context) {
                if (!data.content[0]) return;
                var scriptRun = "var context=$('#innerScript" + data.displayArea + data.name + "'); " + data.content[0];
                eval(scriptRun);
            };

            this.html = function () {
                return '<div class="scriptEvent" id="innerScript' + data.displayArea + data.name + '"></div>';
            };

        },
        score: function (data) {
            this.data = data;
            var tabdiv;
            this.html = function () {
                //var htVal='<canvas id="scEv'+data.id+'"></canvas>';
                var htVal = '<div width="800" height="768" scale="1" id="scEv' + data.displayArea + data.name + '" class="vexScore vex-tabdiv">' + data.content + '</div>';
                return htVal;
            };
            this.preScript = function (context) {
                tabdiv = Vex.Flow.TabDiv.prototype.init("#scEv" + data.displayArea + data.name);
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

                view.id(theEvent.data.displayArea + "Throb").css("opacity","0.7").show().fadeOut(fadeTime);
                
                if (current+beatDuration < duration) {
                    setTimeout(doThrob, beatDuration);
                    current+=beatDuration;
                    currentBeat++;
                }
            }
            setTimeout(doThrob, throbStartTime);
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
                setTimeout(function(){
                  //  self.stop();
                    completeFunction();
                }, duration);
            
            
            
            

            if (self.event.showNextEvent && self.miniEvent) {
                view.id("miniDisplay").show();
                self.miniEvent.miniEvent=null;
                self.miniEvent.getDiv().show();
                self.miniEvent.runScript(duration);
                if (self.event.throbNext) {
                    self.miniEvent.throb(duration);
                }          
            } else {
                view.id("miniDisplay").hide();
            }
            
            if (self.event.throb) self.throb(duration);

            if (self.runScript) self.runScript(duration);
            self.getDiv().show();
            
            
            

            if (self.event.eventCounter && dfs.eventNum<=dfs.eventTotal) {
                view.id("counterDisplay").text(dfs.eventNum+"/"+dfs.eventTotal);
            } else {
                view.id("counterDisplay").hide();
            }

            if (self.event.progressBar) {
                view.id("performanceProgressBar").show().animate({
                    width: "100%"
                }, duration, "linear", function () {
                    // completeFunction used to be here
                });
            } else {
                view.id("performanceProgressBar").hide();
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
            $(displayArea).append($("<div />", {
                class: dispArea + "Event event",
                id: "event" + dispArea + self.id
            }).html(theEvent.html()));

            //    '<div class="' + dispArea
            //   + 'Event" id="event' + dispArea + self.id + '">' + theEvent.html() + '</div>');

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









