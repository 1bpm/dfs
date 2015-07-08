module.exports = function () {  // module.exports is what the requirer sees


    /**
     * generate a random colour
     * @returns {String} the random colour
     */
    function getRandomColour() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }


    function addBlock() {    // a function to repeat

        var t = $("<div />")  // create a div with jquery
                // and randomise some CSS
                .css("width", Math.floor(Math.random() * 120) + "px")
                .css("height", Math.floor(Math.random() * 120) + "px")
                .css("background-color", getRandomColour())
                .css("border-radius",Math.floor(Math.random()*10)+"px")
                .css("position", "absolute")
                .css("display", "block")
                .css("left", Math.floor(Math.random() * 100) + "%")
                .css("top", Math.floor(Math.random() * 100) + "%");

        // append it to the dfscore context
        context.append(t);

        // repeat the add function randomly
        setTimeout(addBlock, Math.random() * 1000);
    };

    // start the repeated addition of blue blocks
    addBlock();
};