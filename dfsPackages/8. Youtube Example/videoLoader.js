module.exports = function () {
    /* 
     *   any external javascript files included need to export what we want
     *   to be executed on the client with module.exports
     *
     *   as this is actually evaluted on the client, variables and functions outside of the export
     *   will not be in scope (module.exports is a node.js object but does not have relevance here in terms of scope)
     *   
     */
    
    
    // array of youtube video IDs related to dfscore
    var vids = ["w9yLFB8qqoI", "_1K173HwtMU", "w9yLFB8qqoI","ZTKtW-C2WXU","L4fESNOhaQs","wlV1xIw2fVE","GA3rSCHklMQ"];
    
    // pick a random one
    var vid = vids[Math.floor(Math.random() * vids.length)];

    // create the iframe pointing to the youtube embed url
    // if we were sensible, the video would be setup in the setup script and then just run here.
    // but.. for this composition we actually want the loading delay
    context.html("<iframe id='rvid' style='width:100%;height:100%;' src='https://www.youtube.com/embed/" + vid + "?autoplay=1'></iframe>");
    
    // make sure the iframe gets removed after the duration of the event.
    // if we were sensible, this would just stop the cached video.
    setTimeout(function () {
        $("#rvid").remove();
    }, duration);

};
