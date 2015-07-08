#!/usr/bin/env node
/**
 *  dfscore
 *  GPL license, see COPYING
 *  copyright 2015 richard@1bpm.net  
 */
var npm=require("npm");

// attempt to dynamically use npm
npm.load(function(npmError){
    if (npmError) throw "There was an error with NPM";
    console.log("Setting up dependencies");
    
    // attempt dynamic (re)install of fibers
    npm.commands.install(["fibers"],function(installError,data){
        if (installError) throw "There was an error installing Fibers. Please attempt this manually.";
        
        // everything ok, launch the dfscore server
        console.log("Dependencies satisfied. Launching dfscore server.");
        require("./lib/server.js").serveForever();
    });
});