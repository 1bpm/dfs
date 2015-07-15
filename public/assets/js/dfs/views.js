window.view = {
    id: function (id) {
        return $("#" + id);
    },
    cls: function (cls) {
        return $("." + cls);
    },
    currentState: null,
    states: {
        log: {
            show: ["notificationArea"],
            run: function (toLog) {
                var levels = {
                    warn: "alert-warning",
                    notification: "alert-info",
                    debug: "alert-success",
                    error: "alert-danger"
                };
                view.id("notificationArea").stop();
                var nID = dfs.uid();
                var notification = $("<div />", {
                    class: "alert " + levels[toLog.level],
                    id: nID
                });
                notification.text(toLog.text);
                view.id("notificationArea").append(notification);
                $("#" + nID).fadeOut(4000);
                setTimeout(function () {
                    $("#" + nID).remove();
                }, 4000);
            }
        },
        clearFatal: {
            hide: ["fatal"]
        },
        fatal: {
            show: ["fatal"],
            hide: ["loading", "performerMenuContainer"],
            run: function (data) {
                if (!data.title)
                    data.title = "Fatal error";
                view.id("fatalLabel").html(data.title);
                if (data.icon)
                    data.icon = "user";
                if (data.icon) {
                    data.text = $("<span />",
                            {
                                class: "glyphicon glyphicon-" + data.icon
                            }).html() + "&nbsp;&nbsp; " + data.text;
                }
                view.id("fatalText").html(data.text);
            }
        },
        init: {
            hide: ["fatal"],
            run: function () {
                view.state("loading", {
                    title: "Connecting to server",
                    text: "Please wait while a connection to the DFS server is established"
                });
            }
        },
        performance: {
            show: ["performance"]
        },
        performanceStart: {
            show: ["performerPrepare"],
            hide: ["performanceControl", "prepareCancel", "performerChoice", "prepareNormal"],
            run: function (data) {
                if (dfs.roleAssigned)
                        view.state("performance");
                    if (!dfs.roleAssigned && dfs.superuser) {
                        // monitor
                    } else if (dfs.superuser) {
                        view.id("performerMenuContainer").show();
                    }
                
                
//                var duration = 5000;
//
//                if (data.countIn)
//                    duration = data.countIn;
//                view.id("prepareHeaderSmall").text(" beginning");
//
//                view.id("prepareCount").animate({
//                    width: "100%"
//                }, duration, "linear", function () {
//                    if (dfs.roleAssigned)
//                        view.state("performance");
//                    if (!dfs.roleAssigned && dfs.superuser) {
//                        // monitor
//                    } else if (dfs.superuser) {
//                        view.id("performerMenuContainer").show();
//                    }
//                });
            }
        },
        quitRole: {
            hide: ["prepareReady", "performance"],
            run: function () {
                dfs.role = null;
                view.id("mainDisplay").empty();
                view.id("miniDisplayInner").empty();
            }
        },
        performanceReady: {
            show: ["performer", "prepareCancel", "performerPrepare", "prepareNormal"],
            hide: ["loading", "prepareReady"],
            run: function (data) {
                if (dfs.superuser) {
                    view.id("performanceControl").show();
                    view.id("performerPrepare").hide();
                }
                dfs.roleAssigned = true;
                //dfs.role=new Role(data);
                dfs.events = {};
                dfs.eventTotal = data.role.totalEvents;
                for (var evName in data.events) {
                    var item = data.events[evName];
                    try {
                        dfs.events[evName] = new Event(item);
                    } catch (error) {
                        dfs.log.warn("error creating event " + evName + ": " + error);
                    }
                }

                for (var trName in data.role.triggers) {
                    var item = data.role.triggers[trName];
                    try {
                        dfs.triggers[trName] = new Trigger(item);
                    } catch (error) {
                        dfs.log.warn("error creating trigger " + trName + ": " + error);
                    }
                }


                if (data.performance.styles) {
                    $("#performanceStyle").remove();
                    var css = "";
                    for (var style in data.performance.styles) {
                        css += data.performance.styles[style];
                    }
                    var cssStyle = $('<style type="text/css" id="performanceStyle">' + css + '</style>');
                    $("head").append(cssStyle);
                }


                view.id("performanceMeta").hide();
                if (!dfs.superuser) {
                    view.id("performanceRoles").hide();
                } else if (data.roles) {
                    data.roles.noPrompt = true;
                    view.state("performanceRoles", data.roles);
                    view.id("roleChoicePrompt").hide();
                }

                var title = data.performance.composer + ": " + data.performance.title;
                view.id("preAmble").html(data.role.preamble);
                view.id("prepareHeader").text(title + "  ");
                view.id("prepareHeaderSmall").text(" preparing");
                //view.state("loading",{title:title,text:"Please prepare for performance"});
                view.id("prepareCancel").show().click(function () {
                    view.state("quitRole");
                    dfs.emit("quitRole");
                });

            }
        },
        loading: {
            hide: ["fatal", "performance"],
            show: ["loading", "logo"],
            fade: true,
            run: function (data) {
                if (!data.title)
                    data.title = "Please wait";
                view.id("loadingTitle").html(data.title);
                if (data.icon) {
                    data.text = $("<span />",
                            {
                                class: "glyphicon glyphicon-" + data.icon
                            }).html() + "&nbsp;&nbsp; " + data.text;
                }
                view.id("loadingText").html(data.text);
            }
        },
        login: {
            hide: ["performanceControl", "loading", "fatal", "performerPrepare", "performance", "superuser", "disable"],
            show: ["logo", "greeting"],
            run: function (data) {
                if (data && data.performanceAvailable) {
                    view.cls("anonymousObserver").show();
                } else {
                    view.cls("anonymousObserver").hide();
                }

                function doLogin() {
                    var theName = view.id("username").val();
                    if (theName === dfs.config.adminUser) {
                        view.state("superuserLogin");
                    } else {
                        dfs.emit("doLogin", {name: theName});
                    }
                }

                view.id("username").unbind().keypress(function (ev) {
                    if (ev.keyCode == 13) {
                        doLogin();
                    }
                });



                view.id("loginButton").unbind().click(function () {
                    doLogin();
                });
            }
        },
        superuserLogin: {
            show: ["password"],
            run: function () {
                function suLogin() {
                    dfs.emit("doLogin", {
                        name: view.id("username").val(),
                        password: view.id("password").val()
                    });
                }
                view.id("loginButton").html('<span class="glyphicon glyphicon-star-empty"></span> superuser').unbind()
                        .click(function () {
                            suLogin();
                        });
                view.id("password").unbind().keypress(function (ev) {
                    if (ev.keyCode == 13) {
                        suLogin();
                    }
                });
                
                // weird workaround for focus not being set properly
                setTimeout(function () {
                    view.id("password").focus();
                }, 1);
            }
        },
        menu: {
            show: ["performerMenu"],
            run: function (data) {
                if (!data.superuser)
                    return;
                view.id("performerMenuContainer").hover(
                        function () {
                            view.id("performerMenuContainer").css("opacity", 0.8);
                            view.id("performerConfigMenu").show();
                        });

                view.id("performerConfigMenu").hover(
                        function () {

                        },
                        function () {
                            view.id("performerMenuContainer").css("opacity", 0.2);
                            view.id("performerConfigMenu").fadeOut();
                        }

                );



                view.id("quitButton").click(function () {
                    dfs.superuser.emit("clearPerformance", {});
                });
                view.id("inObserveButton").click(function () {

                });
            }
        },
        performanceAvailable: {
            show: ["performer", "performerChoice"],
            hide: ["loading", "greeting", "performanceList", "performance"],
            run: function (data) {

                if (dfs.superuser) {
                    view.id("performanceControl").show();
                    view.id("performanceStart").unbind().click(function () {
                        dfs.superuser.emit("beginPerformance", {
                            countIn: 1000 * view.id("performanceCountIn").val()
                        });
                    });
                    view.id("performanceCountIn").unbind().change(function () {
                        view.id("performanceCountInTime").text(view.id("performanceCountIn").val());
                    });
                } else if (dfs.roleAssigned) {
                    view.id("performerChoice").hide();
                    return;
                } else {
                    view.id("performerPrepare").hide();
                    view.id("prepareNormal").hide();
                }
                 
                view.id("performerPrepare").hide();


                dfs.performance.meta = data.meta;
                if (data.meta) {
                    var info = $("<div />", {
                        class: "container"
                    }).append($("<div />", {
                        class: "row"
                    }).html("<h3>" + data.title + "&nbsp;&nbsp;&nbsp;<small>" +
                            data.composer + "</small></h3>")
                            );
                    if (dfs.superuser && data.time) {
                        info.append($("<div />", {
                            class: "row"
                        }).text("Runtime forecast: " + data.time / 1000 + "s")).append($("<div />", {
                            class: "row"
                        }));
                    }
                    info.append($("<div />", {
                        class: "row"
                    }).text("Performance details:"));
                    var metaReps = {
                        duration: function (v) {
                            return ["Duration", v / 1000 + "s"];
                        },
                        tempo: function (v) {
                            return ["Tempo", v + "bpm"];
                        },
                        loop: function (v) {
                            if (!v)
                                return;
                            return ["Loop", "events will be repeated"];
                        },
                        throb: function (v) {
                            if (!v)
                                return;
                            return ["Main screen throb", "on"];
                        },
                        eventCounter: function (v) {
                            return ["Event counter", (v) ? "on" : "off"];
                        },
                        progressBar: function (v) {
                            return ["Countdown bar", (v) ? "on" : "off"];
                        },
                        throbNext: function (v) {
                            return ["Preview screen throb", (v) ? "on" : "off"];
                        },
                        showNextEvent: function (v) {
                            return ["Preview screen", (v) ? "on" : "off"];
                        }

                    };

                    for (var meta in metaReps) {

                        if (meta in data.meta) {
                            var thisMeta = metaReps[meta](data.meta[meta]);
                            if (thisMeta) {
                                var row = $("<div />", {
                                    class: "row"
                                });
                                var key = $("<div />", {
                                    class: "col-xs-6 col-sm-3"
                                }).text(
                                        thisMeta[0]
                                        );
                                var val = key.clone().html("<b>" + thisMeta[1] + "</b>");
                                row.append(key).append(val);
                                info.append(row);


                            }

                        }
                    }


                }
                if (data.intro) {
                    dfs.performance.intro = data.intro;
                    info.append("<br>").append(
                            $("<div />", {
                                class: "thumbnail row"
                            }).text(data.intro)
                            ).append("<hr />");
                }
                view.id("performanceMeta").empty().show().append(info);
                view.state("performanceRoles", data.roles);
            }

        },
        performanceRoles: {
            show: ["performanceRoles"],
            hide: ["loading"],
            run: function (data) {
                var tbl = {Name:[],Information: [], Assigned: [], Action: []};
                var statusPrompt = "";
//                if (!data.noPrompt)
  //                  statusPrompt = "Please select a role from the list below to take part in the performance";
                for (var key in data) {
                    var item = data[key];
                    var id = item.name;
                    var info = "";
                    var show = ["clef", "instrument", "key"];
                    tbl.Name.push("<h3>"+item.name+"</h3>");
                    // show additional fields for superuser
                    if (dfs.superuser) {
                        show.push("totalEvents");
                        show.push("performanceTime");
                    }
                    for (var iKey in show) {
                        var val = item[show[iKey]];
                        if (show[iKey] === "performanceTime") {
                            val = item[show[iKey]] / 1000 + "s";
                        }
                        if (item[show[iKey]])
                            info += show[iKey] + ": <b>" + val + "</b><br>";
                    }
                    tbl.Information.push(info + "<hr />");
                    var assigned;

                    var actions = $("<div />", {
                        class: "btn-group"
                    });


                    // allow it to be chosen if assigned, and kicked if assigned and ur superuser
                    if (item.assignable && !dfs.roleAssigned) {
                        actions.append($("<button />", {
                            class: "btn btn-danger",
                            dfsid: item.name
                        }).text("Select "+item.name).click(function () {
                            dfs.emit("selectRole", {name: $(this).attr("dfsid")});
                        }));
                    } else {
                        
                        // not assignable
                    }
                    if (Object.keys(item.roleMembers).length > 0) {
                        assigned = "<h4>";
                        for (var cKey in item.roleMembers) {
                            var performer = item.roleMembers[cKey];
                            assigned += '<span class="glyphicon glyphicon-user"></span>&nbsp;' + performer.name;
                            if (dfs.superuser) {
                                assigned += '&nbsp;&nbsp;&nbsp;<small><span class="glyphicon glyphicon-globe"></span>' + performer.ip + "</small>";
                            }
                            assigned += "</h4>";
                        }
//kick button
//                        if (dfs.superuser) {
//                            actions.append($("<button />",{
//                                class:"btn btn-danger",
//                                dfsid:id
//                            }).text("Kick").click(function(){
//                                dfs.superuser.emit("kick",{id:
//                                    $(this).attr("dfsid")
//                                });
//                            }));
//                        }


                    } else {
                        assigned = "";//Not assigned";
                    }

                    tbl.Assigned.push(assigned);
                    tbl.Action.push(actions);
                }

                view.tableBuilder(view.id("performanceRoles"), tbl,true);
                if (!dfs.roleAssigned) view.id("performanceRoles").prepend("<h2>Please select a role</h2><br>");
            }
        },
        eventInspector: {
            show: ["eventInspector"],
            hide: [],
            run: function (data) {
                if (data.performanceData) {
                    view.tableBuilder(view.id("eventInspector"));
                }

            }
        },
        eventFollower: {
            show: ["eventInspector"],
            hide: [],
            run: function (data) {
                if (data.performanceData) {

                    view.tableBuilder(view.id("eventInspector"), data.performanceData);
                }

            }
        },
        suListPackages: {
            show: ["performer", "performanceList", "performerChoice"],
            hide: ["performerMenuContainer", "performanceMeta", "performance", "performanceRoles", "performanceControl", "performerPrepare", "greeting", "loading"],
            run: function (request) {
                var packages = request.packages;
                for (var i in packages.Title) {
                    var key = packages.key[i];
                    packages.Title[i] = '<h4 class="namePackage">' + packages.Title[i] + '</h4>';
                    packages.Actions[i] = // '<button pkgid="' + key + '" class="editPackage btn btn-default">Edit</button>&nbsp;&nbsp;' +
                            //   '<button pkgid="' + key + '" class="removePackage btn btn-danger">Remove</button>&nbsp;&nbsp;' +
                            '<button pkgid="' + key + '" class="loadPackage btn btn-primary ">Perform</button>';
                }
                delete packages.key;
                view.tableBuilder(view.id("performanceList"), packages, "<h1>Available compositions</h1><hr />");
                view.cls("loadPackage").click(function () {
                    dfs.superuser.emit("loadPackage", {packageID: $(this).attr("pkgid")});
                });
                view.cls("removePackage").click(function () {
                    var packageID = $(this).attr("pkgid");
                    view.sure(function () {
                        dfs.superuser.emit("removePackage", {id: packageID});
                    }, "Are you sure you want to remove the package?",
                            "This will permanently delete the composition and any files associated with it.");
                });
            }
        }
    },
    // show the modal box
    sure: function (yesCallback, title, text, okOnly) {
        if (!title)
            title = "are you sure?";
        if (!text)
            text = "the operation may not be reversible";
        view.id("modalTitle").html(title);
        view.id("modalText").html(text);
        view.id("modalYes").unbind().click(function () {
            view.id("modal").hide();
            yesCallback();
        });
        if (!okOnly) {
            view.id("modalYes").text("Yes");
            view.id("modalNo").show().unbind().click(function () {
                view.id("modal").fadeOut();
            });
        } else {
            view.id("modalYes").text("OK");
            view.id("modalNo").hide();
        }
        view.id("modal").fadeIn();
    },
    sessionState: function () {
        dfs.emit(cookieData, function (data) {
            if (data.stateData) {
                view.state(data.state, data.stateData);
            } else {
                view.state(data.state);
            }
        });
    },
    // set the view state
    state: function (identifier, data) {
        try {
            var thisState = view.states[identifier];
            if (thisState.run) {
                thisState.run(data);
            }
            if (thisState.hide) {
                for (var hideItem in thisState.hide) {
                    var element = $("#" + thisState.hide[hideItem]);
                    if (thisState.fade) {
                        element.fadeOut();
                    } else {
                        element.hide();
                    }
                }
            }

            if (thisState.show) {
                for (var showItem in thisState.show) {
                    var element = $("#" + thisState.show[showItem]);
                    if (thisState.fade) {
                        element.fadeIn();
                    } else {
                        element.show();
                    }
                }
            }
        } catch (error) {
            if (identifier !== "log") {
                dfs.log.fatal("could not set view state " + identifier + ": " + error);
            }
        }
    },
    clicks: function () {
        view.id("quitButton").click(function () {

        });
    },
    // build a 'table' 
    tableBuilder: function (element, obj, noHeader) {
        var self = this;
        var headers = [];
        var rows = [];
        var ind = 0;
        var container = $("<div />", {
            class: "container"
        });

        this.row = function () {
            var thisRow = $("<div />", {
                class: "row"
            });
            return thisRow;
        };

        this.col = function (html) {
            var item = $("<div />", {
                class: "col-sm-6 col-xs-3"
            });
            item.html(html);
            return item;
        };

        for (var name in obj) {
            headers[ind] = name;
            for (var i = 0; i < obj[name].length; i++) {
                if (!rows[i]) {
                    rows[i] = [];
                }
                rows[i][ind] = obj[name][i];
            }
            ind++;
        }
        if (!noHeader) {
            var headRow = self.row();
            for (var i = 0; i < headers.length; i++) {
                self.col("<h4>" + headers[i] + "</h4>").appendTo(headRow);
            }
            container.append(headRow).append("<hr>");
            //headRow.appendTo(container);
        } else if (noHeader !== true) {
            container.append(noHeader);
        }

        for (var row = 0; row < rows.length; row++) {
            var thisRow = self.row();
            for (var col = 0; col < headers.length; col++) {
                self.col(rows[row][col]).appendTo(thisRow);
            }
            container.append(thisRow);
        }

        element.empty().append(container);

    },
    // build an actual table - defunct
    actualTableBuilder: function (tableRef, obj, noHeader) {
//    var exampleInput_obj = {
//        name: ["alice", "bob", "eve"],
//        role: ["lead", "bass", "rhythm"]
//    };
        var headers = [];
        var rows = [];
        var ind = 0;
        for (var name in obj) {
            headers[ind] = name;
            for (var i = 0; i < obj[name].length; i++) {
                if (!rows[i]) {
                    rows[i] = [];
                }
                rows[i][ind] = obj[name][i];
            }
            ind++;
        }
        tableRef.empty();
        if (!noHeader) {
        var headRow = $("<tr/>");
        for (var i = 0; i < headers.length; i++) {
            headRow.append("<th>" + headers[i] + "</th>");
        }
        tableRef.append(headRow);
    }
        for (var row = 0; row < rows.length; row++) {
            var theRow = $("<tr/>");
            for (var col = 0; col < headers.length; col++) {
                theRow.append("<td>" + rows[row][col] + "</td>");
            }
            tableRef.append(theRow);
        }
    }

};