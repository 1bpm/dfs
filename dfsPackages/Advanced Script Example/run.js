module.exports = function () {
    
    // get a unique score id from the dfscore context id
    var tid = context.attr("id") + "score";
    // run the physics circle generator
    window.andreaeScore(tid);
    // tagged on to window as that's the easiest for porting over
    
};
        