var webSocketServer = require('websocket').server;
var path=require("path");
var fs=require("fs");
var url=require("url");
var mime=require("mime");
var http=require("http");
var dfs=require("./dfs.js");
var config=require("../config.json");


this.serveForever=function() {
    config.serverAddress=config.listenAddress;
    servers.http.listen(config.serverPort, function () {
        dfs.log.notify("http server started on "+config.serverAddress+":" + config.serverPort);
    });

    servers.websocket = new webSocketServer({
        httpServer: servers.http
    });

    servers.websocket.on("request", function (request) {
        dfs.clientConnect(request);
    });
};


/**
 * process a regular http request
 * @param {httpRequest} request
 * @param {httpResponse} response
 * @returns {undefined}
 */
function serveFile(request,response) {
    // parse the path
    var pathref = url.parse(request.url).pathname;
    var splitPath = pathref.split("/");
    var filename = path.join(process.cwd(), "public", pathref);
    // determine the type of request
    if (splitPath[1] === "assets" && splitPath[2] === "performance" && dfs.document) {

        // a dynamic request specific to the performance
        //filename = dfs.performance.getResource(splitPath[3]);
        filename=path.join(dfs.document.packageDirectory,splitPath[3]);
    } else if (!splitPath[1] || splitPath[1] === "") {
        // default request: the index file
        filename = path.join(process.cwd(), "public", "index.html");
    } else if (splitPath[1] === "config") {
        response.writeHead(200, {"Content-Type": "application/json"});
        // reparse- copy/extend object...
        var sendConfig=JSON.stringify(config);
        sendConfig=JSON.parse(sendConfig);
        delete sendConfig.adminPassword;
        response.end(JSON.stringify(sendConfig));
        return;
    }

    // check the requested file exists
    fs.exists(filename, function (exists) {
        if (!exists) {
            // return the 404 page
            response.writeHead(404, {'Content-Type': 'text/html'});
            var fileStream = fs.createReadStream(path.join(process.cwd(), "lib", "ht", "404.html"));
            fileStream.pipe(response);
            return;
        }

        // return the file after setting the correct mime type
        var mimeType = mime.lookup(filename);
        response.writeHead(200, {'Content-Type': mimeType});
        var fileStream = fs.createReadStream(filename);
        fileStream.pipe(response);
    });
};

var servers={
    http:http.createServer(function(request,response) {
        return serveFile(request,response);
    }),
    websocket: null
};