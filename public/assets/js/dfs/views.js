var view={
    id:function(id) {
        return $("#"+id);
    },
    cls:function(cls) {
        return $("."+cls);
    },
    currentState:null,
    states:{
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
                var nID=dfs.uid();
                var notification=$("<div />",{
                    class:"alert "+levels[toLog.level],
                    id: nID
                });
                notification.text(toLog.text);
                view.id("notificationArea").append(notification);
                $("#"+nID).fadeOut(4000);
                setTimeout(function () {
                    $("#"+nID).remove();
                }, 4000);
            }
        },
        clearFatal:{
            hide:["fatal"]
        },
        fatal: {
            show: ["fatal"],
            hide: ["loading"],
            run: function (data) {
                if (!data.title) data.title="Fatal error";
                view.id("fatalLabel").html(data.title);
                if (data.icon) data.icon="user";
                if (data.icon) {
                    data.text=$("<span />",
                                {
                                    class:"glyphicon glyphicon-"+data.icon
                                }).html()+"&nbsp;&nbsp; "+data.text;
                }
                view.id("fatalText").html(data.text);
            }
        },
        init: {
            hide: ["fatal"],
            run:function(){
                view.state("loading",{
                    title:"Connecting to server",
                    text:"Please wait while a connection to the DFS server is established"
                });
            }
        },
        performance:{
            show:["performance"]
        },
        performanceStart: {
            show:["performerPrepare","prepareReady"],
            hide:["performanceControl","prepareCancel","performerChoice","prepareNormal"],
            run:function(data) {
                var duration=5000;
                if (data.countIn) duration=data.countIn;
                view.id("prepareHeaderSmall").text(" beginning");
                view.id("prepareCount").animate({
                    width:"100%"
                },duration,"linear",function() {
                    view.state("performance");
                });
            }
        },
        quitRole:{
            hide:["prepareReady","performance"],
            run:function(){
                dfs.role=null;
                view.id("mainDisplay").empty();
                view.id("miniDisplayInner").empty();
            }
        },
        performanceReady: {
            show:["performer","prepareCancel","performerPrepare","prepareNormal"],
            hide:["loading","prepareReady"],
            run:function(data){
                if (dfs.superuser) {
                    view.id("performanceControl").show();
                }
                dfs.role=new Role(data);
                if (data.styles) {
                    $("#performanceStyle").remove();
                    var css="";
                    for (var style in data.styles) {
                        css+=data.styles[style];
                    }
                    var cssStyle = $('<style type="text/css" id="performanceStyle">'+css+'</style>');
                    $("head").append(cssStyle);
                }
                view.id("performanceMeta").hide();
                if (!dfs.superuser) {
                    view.id("performanceRoles").hide();
                } else {
                    view.id("roleChoicePrompt").hide();
                }
                var title=dfs.performance.meta.composer+": "+dfs.performance.meta.title;
                view.id("preAmble").html(data.preAmble);
                view.id("prepareHeader").text(title+"  ");
                view.id("prepareHeaderSmall").text(" preparing");
                //view.state("loading",{title:title,text:"Please prepare for performance"});
                view.id("prepareCancel").click(function(){
                    view.state("quitRole");
                    dfs.emit("quitRole");
                });

            }
        },
        loading: {
            hide: ["fatal","performance"],
            show: ["loading", "logo"],
            fade: true,
            run: function (data) {
                if (!data.title) data.title="Please wait";
                view.id("loadingTitle").html(data.title);
                if (data.icon) {
                    data.text=$("<span />",
                            {
                                class:"glyphicon glyphicon-"+data.icon
                            }).html()+"&nbsp;&nbsp; "+data.text;
                }
                view.id("loadingText").html(data.text);
            }
        },
        login: {
            hide: ["performanceControl","loading","fatal","performerPrepare","performance", "superuser", "disable"],
            show: ["logo", "greeting"],
            run:function(data){
                if (data && data.performanceAvailable) {
                    view.cls("anonymousObserver").show();
                } else {
                    view.cls("anonymousObserver").hide();
                }
                var theName=view.id("username").val();
                view.id("loginButton").unbind().click(function(){
                    if (theName===dfs.config.adminUser) {
                        view.state("superuserLogin");
                    } else {
                        dfs.emit("doLogin",{name:theName});
                    }
                });
            }
        },
        superuserLogin: {
            show: ["password"],
            run: function(){
                view.id("loginButton").html('<span class="glyphicon glyphicon-star-empty"></span> superuser').unbind()
                    .click(function(){
                        dfs.emit("doLogin",{
                            name:view.id("username").val(),
                            password:view.id("password").val()
                        })
                });
            }
        },
        menu:{
            show:["performerMenu"],
            run:function(data){
                view.id("performerName").text(data.name);
            }
        },
        performanceAvailable:{
            show:["performer"],
            hide:["loading","greeting","performerPrepare","performanceList"],
            run:function(data){
                if (dfs.superuser) {
                    view.id("performanceControl").show();
                    view.id("performanceStart").unbind().click(function() {
                        dfs.superuser.emit("beginPerformance", {
                            countIn: 1000*view.id("performanceCountIn").val()
                        });
                    });
                    view.id("performanceCountIn").unbind().change(function(){
                        view.id("performanceCountInTime").text(view.id("performanceCountIn").val());
                    });
                }
                    dfs.performance.meta=data.meta;
                    if (data.meta) {
                        var info=$("<div />",{
                            class:"container"
                        }).append($("<div />",{
                            class:"row"
                        }).html("<h3>"+data.meta.composer+": "+
                            data.meta.title+"</h3>")
                        );
                        for (var metaKey in data.meta) {
                            var meta=data.meta[metaKey];
                            if (metaKey!="composer" &&
                                    metaKey!="title") {
                                var row=$("<div />",{
                                    class:"row"
                                });
                                var key= $("<div />",{
                                    class:"col-xs-6 col-sm-3"
                                }).text(metaKey);
                                var val=key.clone().html("<b>"+meta+"</b>");
                                row.append(key).append(val);
                                info.append(row);
                            }
                        }
                    }
                    if (data.intro) {
                        dfs.performance.intro=data.intro;
                        info.append("<br>").append(
                            $("<div />",{
                                class:"thumbnail row"
                            }).text(data.intro)
                        ).append("<hr />");
                    }
                    view.id("performanceMeta").empty().show().append(info);
                    view.state("performanceRoles",data.roles);
                }

        },
        performanceRoles:{
            show:["performanceRoles"],
            hide:["loading"],
            run:function(data){
                var tbl={Name:[],Information:[],Assigned:[],Action:[]};
                console.log(data);
                var statusPrompt="Please select a role from the list below to take part in the performance"
                for (var key in data) {
                    var item=data[key];
                    var id=item.id;
                    tbl.Name.push("<h3>"+item.name+"<h3>");
                    var info="";
                    var show=["clef","instrument","key"];
                    for (var iKey in show) {
                        info+=show[iKey]+": <b>"+item[show[iKey]]+"</b><br>";
                    }
                    tbl.Information.push(info+"<hr />");
                    var assigned;

                    var actions=$("<div />",{
                        class:"btn-group"
                    });

                    if (item.assignable) {
                        actions.append($("<button />",{
                            class:"btn btn-default",
                            dfsid:id
                        }).text("Select").click(function(){
                            dfs.emit("selectRole",{id:$(this).attr("dfsid")});
                        }));
                    } else {

                    }

                    if (item.clients) {
                        assigned="";
                        for (var cKey in item.clients) {
                            var client=item.clients[cKey];
                            assigned+="name: "+client.name;
                            if (dfs.superuser) {
                                assigned+="<br>ip: "+client.ip;



                            }
                            assigned+="<hr />";
                        }

                        if (dfs.superuser) {
                            actions.append($("<button />",{
                                class:"btn btn-danger",
                                dfsid:id
                            }).text("Kick").click(function(){
                                dfs.superuser.emit("kick",{id:
                                    $(this).attr("dfsid")
                                });
                            }));
                        }

                    } else {
                        assigned="No performer";
                    }
                    tbl.Assigned.push(assigned);





                    tbl.Action.push(actions);
                }

                view.tableBuilder(view.id("performanceRoles"),tbl,
                    $("<div />",{
                        class:"alert alert-info",
                        id:"roleChoicePrompt"
                    }).text(statusPrompt));
            }
        },

        eventInspector:{
            show:["eventInspector"],
            hide:[],
            run:function(data) {
                if (data.performanceData) {
                    view.tableBuilder(view.id("eventInspector"));
                }

            }
        },
        eventFollower:{
            show:["eventInspector"],
            hide:[],
            run:function(data) {
                if (data.performanceData) {

                    view.tableBuilder(view.id("eventInspector"),data.performanceData);
                }

            }
        },

        suListPackages: {
            show: ["performer","performanceList","performerChoice"],
            hide: ["performance","performanceRoles","performanceControl","performerPrepare","greeting","loading"],
            run: function (request) {
                var packages = request.packages;
                for (var i in packages.Title) {
                    var key = packages.key[i];
                    packages.Title[i] = '<h4 class="namePackage">' + packages.Title[i] + '</h4>';
                    packages.Actions[i] = '<button pkgid="' + key + '" class="editPackage btn btn-default">Edit</button>&nbsp;&nbsp;'+
                        '<button pkgid="' + key + '" class="removePackage btn btn-danger">Remove</button>&nbsp;&nbsp;'+
                        '<button pkgid="' + key + '" class="loadPackage btn btn-primary ">Perform</button>';
                }
                delete packages.key;
                view.tableBuilder(view.id("performanceList"), packages,"<h1>Available compositions</h1><hr />");
                view.cls("loadPackage").click(function () {
                    dfs.superuser.emit("loadPackage", {packageID: $(this).attr("pkgid")});
                });
                view.cls("removePackage").click(function () {
                    var packageID = $(this).attr("pkgid");
                    view.sure(function () {
                        dfs.superuser.emit("removePackage", {id: packageID});
                    },"Are you sure you want to remove the package?",
                    "This will permanently delete the composition and any files associated with it.");
                });
            }
        }
    },
    sure:function (yesCallback,title,text,okOnly) {
        if (!title) title = "are you sure?"
        if (!text) text = "the operation may not be reversible";
        view.id("modalYes").unbind();
        view.id("modalNo").unbind();
        view.id("modalTitle").html(title);
        view.id("modalText").html(text);
        view.id("modalYes").click(function () {
            view.id("modal").hide();
            yesCallback();
        });
        if (!okOnly) {
            view.id("modalYes").text("Yes");
            view.id("modalNo").show();
            view.id("modalNo").click(function () {
                view.id("modal").fadeOut();
            });
        } else {
            view.id("modalYes").text("OK");
            view.id("modalNo").hide();
        }
        view.id("modal").fadeIn();
    },
    sessionState:function() {
        dfs.emit(cookieData,function(data){
            if (data.stateData) {
                view.state(data.state,data.stateData);
            } else {
                view.state(data.state);
            }
        });
    },
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
            if (identifier != "log") {
                dfs.log.fatal("could not set view state "+identifier+": " + error);
            }
        }
    },

    clicks:function() {
        view.id("quitButton").click(function(){

        });
    },

    tableBuilder:function(element,obj,noHeader) {
        var self = this;
        var headers = [];
        var rows = [];
        var ind = 0;
        var container = $("<div />", {
            class: "container-fluid"
        });

        this.row = function () {
            var thisRow = $("<div />", {
                class: "row"
            });
            return thisRow;
        };

        this.col = function (html) {
            var item = $("<div />", {
                class: "col-xs-6 col-sm-3"
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
        } else if (noHeader!==true) {
            container.append(noHeader);
        }

        for (var row = 0; row < rows.length; row++) {
            var thisRow=self.row();
            for (var col = 0; col < headers.length; col++) {
                self.col(rows[row][col]).appendTo(thisRow);
            }
            container.append(thisRow);
        }

        element.empty().append(container);

    },

    tabledBuilder:function (tableRef, obj) {
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
        var headRow = $("<tr/>");
        for (var i = 0; i < headers.length; i++) {
            headRow.append("<th>" + headers[i] + "</th>");
        }
        tableRef.append(headRow);
        for (var row = 0; row < rows.length; row++) {
            var theRow = $("<tr/>");
            for (var col = 0; col < headers.length; col++) {
                theRow.append("<td>" + rows[row][col] + "</td>");
            }
            tableRef.append(theRow);
        }
    }

}