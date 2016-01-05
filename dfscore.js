#!/usr/bin/env node
var npm=require("npm");

// attempt to dynamically use npm
npm.load(function(npmError){
    if (npmError) throw "There was an error with NPM";
    console.log("Setting up dependencies");
    
    // attempt dynamic (re)install of fibers
    npm.commands.install(["fibers@1.0.6"],function(installError,data){
        if (installError) throw "There was an error installing Fibers. Please attempt this manually.";
        
        // everything ok, launch the dfscore server
        console.log("Dependencies satisfied. Launching dfscore server.");
        require("./lib/server.js").serveForever();
    });
});