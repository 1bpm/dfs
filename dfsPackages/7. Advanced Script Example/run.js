module.exports = function () {
    
    // get a unique score id from the dfscore context id
    var tid = context.attr("id") + "score";
    
    // run the graphics generator which was tagged on to dfs. in the setup script
    dfs.andreaeScore(tid);  
    
};
        