module.exports=function(){  // module.exports is what the requirer sees
    
    function add() {    // a function to repeat
        
        var t=$("<div />")  // create a div with jquery
                            // and randomise some CSS
                .css("width",Math.floor(Math.random()*120)+"px")
                .css("height",Math.floor(Math.random()*120)+"px")
                .css("background-color","#0000DD") // always blue
                .css("position","absolute")
                .css("display","block")
                .css("left",Math.floor(Math.random()*100)+"%")
                .css("top",Math.floor(Math.random()*100)+"%");
        
        // append it to the dfscore context
        context.append(t);
        
        // repeat the add function randomly
        setTimeout(add,Math.random()*1000);
    }
    
    // start the repeated addition of blue blocks
    add();
};