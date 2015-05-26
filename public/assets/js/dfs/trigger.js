var Trigger=function() {
    var id=Session.uid();
    var active=false;
    var bind;

    this.unbind=function() {
        bind.unbind();
    };


};

var Listener=function(data){
    this.id=dfs.uid();
    this.active=false;
    var callback;
    var listener;
    var types={
        "audio.pitch":PitchListener,
        "key.press":function () {
            this.listen=function() {
                Page.performance.main.keydown(function(theEvent) {
                    listener.outputFrame({key:theEvent.keyCode});
                });
            };
        },
        "mouse.drag":function() {

            this.unbind=function(){
                $(document).off("mousemove");
            }

            this.bind=function() {
                $(document).mousemove(function(theEvent) {
                    listener.outputFrame({x:theEvent.clientX,y:theEvent.clientY});
                });
            }
        },
        "mouse.click":function() {

                this.unbind=function(){
                    $(document).off("mousemove");
                }
                this.bind=function() {
                    $(document).mousedown(function (theEvent) {
                        listener.outputFrame({x: theEvent.clientX, y: theEvent.clientY});
                    });
                }

        }
    };

    };


    this.unbind=function() {
        self.listener.unbind();
    };


    this.setActive=function(state) {
        if (state && !active) {
            this.listen();
            active=state;
        }
        if (!state && active) {
            this.clear();
            active=state;
        }
    };


    this.outputFrame=function(theData) {
        var toSend={
            type:"Performance",
            performance: {
                type: "frame",
                id:id,
                data:theData
            }
        };
        Dfs.emit(toSend);
    };

};


this.trigger=function() {
    var toSend={
        type:"Performance",
        performance : {
            type:"trigger",
            id:id
        }
    };
    Dfs.emit(toSend);
};


var KeyTrigger = function (key, id) {
    var listener = new Listener();
    listener.setID(id);
    this.listen = function () {
        document.keydown(function (theEvent) {
            if (theEvent.keyCode === key) {
                listener.trigger();
            }

        });
    };
};



var ClickListener=
};

var DragListener=function() {
    this.listen=function() {
        $(document).mousedown(function(theEvent) {
            $(document).mousemove(function(theEvent) {
                listener.outputFrame({x:theEvent.clientX,y:theEvent.clientY});
            });
        });
    };

};

var AudioListener=function() {

    this.setup=function() {
        if (!DfsAudio.active) {
            DfsAudio.setup();
        }
    };

    this.listen=function() {
        this.pitchTrack(function(pitchVal) {
            this.emit(pitchVal);
        });
    };
    this.clear=function() {

    };
    this.pitchTrack=function(callback) {
        dfsAudio.initAnalysis();

    };
};

var DfsAudio={
    audioContext:new AudioContext(),
    sourceNode:null,
    buffer:new Float32Array(1024),
    analyser:null,
    active:false,
    setup:function() {

    },
    setInput:function() {

    },
    enableAudio:function() {
        this.analyseLive();

    },
    analyseLive:function(callback) {
        try {
            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia;
            navigator.getUserMedia({
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                }
            }, function() {
                sourceNode = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                sourceNode.connect(analyser);
                analyser.connect(audioContext.destination);
                sourceNode.start(0);
                callback(buffer);
            }, function(error) {
                log.fatal("analyser setup error: "+error);
            });
        } catch (error) {
            log.fatal("getUserMedia error: "+error);
        }
    },
    autoCorrelate:function(buffer) {
        var sampleRate=audioContext.sampleRate;
        var SIZE = buffer.length;
        var MAX_SAMPLES = Math.floor(SIZE/2);
        var best_offset = -1;
        var best_correlation = 0;
        var rms = 0;
        var foundGoodCorrelation = false;
        var correlations = new Array(MAX_SAMPLES);
        for (var i=0;i<SIZE;i++) {
            var val = buffer[i];
            rms += val*val;
        }
        rms = Math.sqrt(rms/SIZE);
        if (rms<0.01)
            return -1;

        var lastCorrelation=1;
        for (var offset = MIN_SAMPLES; offset < MAX_SAMPLES; offset++) {
            var correlation = 0;

            for (var i=0; i<MAX_SAMPLES; i++) {
                correlation += Math.abs((buffer[i])-(buffer[i+offset]));
            }
            correlation = 1 - (correlation/MAX_SAMPLES);
            correlations[offset] = correlation;
            if ((correlation>0.9) && (correlation > lastCorrelation)) {
                foundGoodCorrelation = true;
                if (correlation > best_correlation) {
                    best_correlation = correlation;
                    best_offset = offset;
                }
            } else if (foundGoodCorrelation) {
                var shift = (correlations[best_offset+1] - correlations[best_offset-1])/correlations[best_offset];
                return sampleRate/(best_offset+(8*shift));
            }
            lastCorrelation = correlation;
        }
        if (best_correlation > 0.01) {
            return sampleRate/best_offset;
        }
        return -1;
    }

};


//
//var audioContext = null;
//var isPlaying = false;
//var sourceNode = null;
//var analyser = null;
//var theBuffer = null;
//var DEBUGCANVAS = null;
//var mediaStreamSource = null;
//var detectorElem, 
//	canvasElem,
//	waveCanvas,
//	pitchElem,
//	noteElem,
//	detuneElem,
//	detuneAmount;
//
//window.onload = function() {
//	audioContext = new AudioContext();
//	MAX_SIZE = Math.max(4,Math.floor(audioContext.sampleRate/5000));	// corresponds to a 5kHz signal
//	var request = new XMLHttpRequest();
//	request.open("GET", "../sounds/whistling3.ogg", true);
//	request.responseType = "arraybuffer";
//	request.onload = function() {
//	  audioContext.decodeAudioData( request.response, function(buffer) { 
//	    	theBuffer = buffer;
//		} );
//	}
//	request.send();
//
//	detectorElem = document.getElementById( "detector" );
//	canvasElem = document.getElementById( "output" );
//	DEBUGCANVAS = document.getElementById( "waveform" );
//	if (DEBUGCANVAS) {
//		waveCanvas = DEBUGCANVAS.getContext("2d");
//		waveCanvas.strokeStyle = "black";
//		waveCanvas.lineWidth = 1;
//	}
//	pitchElem = document.getElementById( "pitch" );
//	noteElem = document.getElementById( "note" );
//	detuneElem = document.getElementById( "detune" );
//	detuneAmount = document.getElementById( "detune_amt" );
//
//	detectorElem.ondragenter = function () { 
//		this.classList.add("droptarget"); 
//		return false; };
//	detectorElem.ondragleave = function () { this.classList.remove("droptarget"); return false; };
//	detectorElem.ondrop = function (e) {
//  		this.classList.remove("droptarget");
//  		e.preventDefault();
//		theBuffer = null;
//
//	  	var reader = new FileReader();
//	  	reader.onload = function (event) {
//	  		audioContext.decodeAudioData( event.target.result, function(buffer) {
//	    		theBuffer = buffer;
//	  		}, function(){alert("error loading!");} ); 
//
//	  	};
//	  	reader.onerror = function (event) {
//	  		alert("Error: " + reader.error );
//		};
//	  	reader.readAsArrayBuffer(e.dataTransfer.files[0]);
//	  	return false;
//	};
//
//
//
//};
//
//
//
//function toggleOscillator() {
//    if (isPlaying) {
//        //stop playing and return
//        sourceNode.stop( 0 );
//        sourceNode = null;
//        analyser = null;
//        isPlaying = false;
//		if (!window.cancelAnimationFrame)
//			window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
//        window.cancelAnimationFrame( rafID );
//        return "play oscillator";
//    }
//    
//    isPlaying = true;
//    isLiveInput = false;
//    updatePitch();
//
//    return "stop";
//}
//
//function toggleLiveInput() {
//    if (isPlaying) {
//        //stop playing and return
//        sourceNode.stop( 0 );
//        sourceNode = null;
//        analyser = null;
//        isPlaying = false;
//		if (!window.cancelAnimationFrame)
//			window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
//        window.cancelAnimationFrame( rafID );
//    }
//    getUserMedia(
//    	{
//            "audio": {
//                "mandatory": {
//                    "googEchoCancellation": "false",
//                    "googAutoGainControl": "false",
//                    "googNoiseSuppression": "false",
//                    "googHighpassFilter": "false"
//                },
//                "optional": []
//            },
//        }, gotStream);
//}
//
//function togglePlayback() {
//    if (isPlaying) {
//        //stop playing and return
//        sourceNode.stop( 0 );
//        sourceNode = null;
//        analyser = null;
//        isPlaying = false;
//		if (!window.cancelAnimationFrame)
//			window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
//        window.cancelAnimationFrame( rafID );
//        return "start";
//    }
//
//    sourceNode = audioContext.createBufferSource();
//    sourceNode.buffer = theBuffer;
//    sourceNode.loop = true;
//
//    analyser = audioContext.createAnalyser();
//    analyser.fftSize = 2048;
//    sourceNode.connect( analyser );
//    analyser.connect( audioContext.destination );
//    sourceNode.start( 0 );
//    isPlaying = true;
//    isLiveInput = false;
//    updatePitch();
//
//    return "stop";
//}
//
//var rafID = null;
//var tracks = null;
//var buflen = 1024;
//var buf = new Float32Array( buflen );
//
//var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
//
//function noteFromPitch( frequency ) {
//	var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
//	return Math.round( noteNum ) + 69;
//}
//
//function frequencyFromNoteNumber( note ) {
//	return 440 * Math.pow(2,(note-69)/12);
//}
//
//function centsOffFromPitch( frequency, note ) {
//	return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
//}
//
//
//
//
//function updatePitch(buffer) {
//    var cycles = new Array;
//    analyser.getFloatTimeDomainData(buffer);
//    var ac = autoCorrelate(buffer);
//    detectorElem.className = "confident";
//    pitch = ac;
//    pitchElem.innerText = Math.round(pitch);
//    var note = noteFromPitch(pitch);
//    noteElem.innerHTML = noteStrings[note % 12];
//    var detune = centsOffFromPitch(pitch, note);
//    if (detune == 0) {
//        detuneElem.className = "";
//        detuneAmount.innerHTML = "--";
//    } else {
//        if (detune < 0)
//            detuneElem.className = "flat";
//        else
//            detuneElem.className = "sharp";
//        detuneAmount.innerHTML = Math.abs(detune);
//    }
//}
