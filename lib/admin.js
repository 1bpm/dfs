var fs = require("fs");
var Document = require("./document.js");

var dfs = require("./dfs.js");
var userspace = require("./userPerformance.js");





module.exports = function (emitter, superClient) {
    var self = this;
    this.client = superClient;
    this.emit = emitter;
    var document;
    var packages = {};
    var routes = {
        kick: function (data) {
            if (dfs.clients[data.id])
                dfs.clients[data.id].quitRole();
        },
        clearPerformance: function () {
            userspace.space.reset();
            dfs.eachClient(function (client) {
                client.emit("resetPerformance");
            });
            self.listPackages();
        },
        listPackages: function (data) {
            self.listPackages();
        },
        loadPackage: function (data) {
            try {
                userspace.space.reset();
                document = new Document(packages[data.packageID]);//new PackageParser(packages[data.packageID]);
                dfs.document = document;
            } catch (error) {             
                console.log(error);
                self.emit("objectState", {dfs: error});
            }

        },
        removePackage: function (data) {
            if (data.id in packages) {
                fs.rmdir("./dfsPackages/" + packages[data.id], function (error) {
                    if (error) {
                        self.client.emit("log", {level: "warn", text: "Could not delete " + packages[data.id] + ": " + error});
                    } else {
                        self.listPackages();
                    }
                });
            }

        },
        beginPerformance: function (data) {
            document.run(data.countIn);
            //dfs.performance.run(data.countIn);

        },
        userspaceEval: function (data) {
            if (data.code) {
                var result;
                try {
                    with (userspace.space) {
                        result = userspace.space.eval(data.code);
                    }
                } catch (error) {
                    result = "cannot evaluate: " + error;
                }
                self.emit("objectState", {dfs: result});
            }
        },
        objectState: function () {
            var cache = [];
            var thisData = JSON.stringify(dfs, function (key, value) {
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        // Circular reference found, discard key
                        return;
                    }
                    // Store value in our collection
                    cache.push(value);
                }
                return value;
            }, 2);

            self.emit("objectState", {dfs: thisData});
        }

    };



    this.performanceLoaded = function () {
        dfs.eachClient(function (client) {
            var data = {
                roles: dfs.performance.getRoleOverviews(),
                meta: dfs.performance.meta,
                intro: dfs.performance.introductionText
            };
            if (!client.name) {
                data.view = "login";
            }
            if (client.name) {
                client.emit("performanceAvailable", data);
            }
        });

        //
    };

    this.listPackages = function () {
        while (packages.length > 0) {
            packages.pop();
        }
        var pack = {key: [], Title: [], Actions: []};
        var fList = fs.readdirSync("./dfsPackages");
        for (var item in fList) {
            if (item !== "") {
                var skey = dfs.uid();
                packages[skey] = fList[item];
                pack.key.push(skey);
                pack.Title.push(fList[item]);
            }
        }
        self.client.view("suListPackages", {packages: pack});
    };





    this.routing = function (request) {
        if (request.route in routes) {
            routes[request.route](request);
        } else {
            dfs.log.warn("unknown admin route " + request.route);
        }

    };
};