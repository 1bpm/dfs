module.exports = function () {

    // unique id derived from the dfscore context
    var tid = context.attr("id") + "score";

    // append svg element to the dfscore context
    context.append('<svg xmlns="http://www.w3.org/2000/svg" id="' + tid + '" style="width:100%;height:100%;"></svg>');

    // if some instance of the andreaeScore script isn't already setup
    if (!dfs.andreaeScore) {

        // require d3
        require(["/assets/performance/d3.js"], function (d3) {
               
            
            // andreae-score from Madwort.co.uk
            // altered to take selector as arg
            dfs.andreaeScore = function (id) {
                function generateRandomScore(numLoops, width, height, boundary) {
                    var loops = [];
                    for (var i = 0; i < numLoops; i++) {
                        loops.push({
                            "id": String.fromCharCode(i + 97),
                            // add 70 to ensure we don't go outside our bounding box with max radius
                            "x": Math.floor(boundary + Math.random() * (width - (2 * boundary))),
                            "y": Math.floor(boundary + Math.random() * (height - (2 * boundary))),
                            "r": Math.floor(10 + Math.random() * 80)
                        });
                    }

                    loops.forEach(function (l) {
                        // always have 0-point
                        l.angles = [
                            {"time": 0, "lineLength": 30}
                        ];

                        // generate up to 4 random angles
                        for (var i = 0; i < (Math.random() * 4); i++) {
                            l.angles.push({"time": Math.random(), "lineLength": 20});
                        }
                    });

                    var edges = [];
                    loops.forEach(function (l, i) {
                        var target = Math.floor(loops.length * Math.random());
                        // eliminate edges that connect to self
                        while (target == i) {
                            target = Math.floor(loops.length * Math.random());
                        }
                        // TODO: eliminate edges that replicate an existing connection
                        // in the reverse direction
                        // TODO: consider connecting disconnected subgraphs
                        edges.push({"source": i, "target": target});
                    });
                    return {"loops": loops, "edges": edges};
                }
                ;
                var mySvg = d3.select("svg#" + id);
                var TAU = 2 * Math.PI;

                var width = d3.select("#" + id).node().getBoundingClientRect().width;
                var height = d3.select("#" + id).node().getBoundingClientRect().height;
                var boundary = 70;

                // d3.json("graphs/3.json", function(error, graph) {
                //   drawScore(graph);
                // });

                // 2 to 11 loops
                var graph = generateRandomScore(
                        (Math.random() * 10) + 1,
                        width,
                        height,
                        boundary);
                drawScore(graph);

                function xBoundary(x) {
                    if (x < (boundary)) {
                        return boundary;
                    } else {
                        if (x > (width - boundary)) {
                            return (width - boundary);
                        } else {
                            return x;
                        }
                    }
                }

                function yBoundary(y) {
                    if (y < (boundary)) {
                        return boundary;
                    } else {
                        if (y > (height - boundary)) {
                            return (height - boundary);
                        } else {
                            return y;
                        }
                    }
                }

                function dumpGraph() {
                    console.log(JSON.stringify(graph));
                }

                function drawScore(graph) {
                    // console.log(graph);
                    // console.log(JSON.stringify(graph));
                    var loops = graph.loops;
                    var edges = graph.edges;

                    var force = d3.layout.force()
                            .size([width, height])
                            .nodes(loops)
                            .links(edges);

                    force.gravity(0.0005);

                    // force.charge(-100);
                    force.charge(function (n) {
                        return -2 * n.r;
                    });

                    // force.linkDistance(50);
                    force.linkDistance(function (l) {
                        return 50 + 2 * (l.source.r + l.target.r);
                    });

                    // draw edges first so they go underneath the loops
                    var edge = mySvg.selectAll('.edge')
                            .data(edges)
                            .enter().append('line')
                            .attr('class', 'edge')
                            // use a different syntax first time we access d.source?
                            .attr('x1', function (d) {
                                return loops[d.source].x;
                            })
                            .attr('y1', function (d) {
                                return loops[d.source].y;
                            })
                            .attr('x2', function (d) {
                                return loops[d.target].x;
                            })
                            .attr('y2', function (d) {
                                return loops[d.target].y;
                            });

                    var node = mySvg.selectAll('.node')
                            .data(loops)
                            .enter().append('g')
                            .attr('class', 'node');

                    // http://paletton.com/#uid=75c0u0kpZtEg7EmlcvNtEoSwijJ
                    var colourPalette = ["#C12477", "#22B734", "steelblue", "yellow", "#EC362C", "#B3EB4F", "#800043"];
                    function randomColourFromId(d, i) {
                        return colourPalette[i % colourPalette.length];
                    }

                    node.append('circle')
                            .style("fill", randomColourFromId)
                            .style("stroke", randomColourFromId)
                            .style("fill-opacity", 0)
                            .attr('id', function (d) {
                                return d.id;
                            })
                            .attr('r', function (d) {
                                return d.r;
                            })
                            .attr('cx', function (d) {
                                return d.x;
                            })
                            .attr('cy', function (d) {
                                return d.y;
                            });

                    // console.log(node);

                    node.selectAll("line")
                            .data(function (d) {
                                return d.angles;
                            })
                            .enter().append("line")
                            .attr("x1", function (d) {
                                // console.log();
                                return (
                                        parseFloat(d3.select(this.parentNode).select("circle").attr('cx')) +
                                        (
                                                parseFloat(d3.select(this.parentNode).select("circle").attr('r')) +
                                                (d.lineLength / 2)
                                                ) * Math.sin(d.time * TAU)
                                        )
                                        ;
                            })
                            .attr("y1", function (d) {
                                return (
                                        parseFloat(d3.select(this.parentNode).select("circle").attr('cy')) -
                                        (
                                                parseFloat(d3.select(this.parentNode).select("circle").attr('r')) +
                                                (d.lineLength / 2)
                                                ) * Math.cos(d.time * TAU)
                                        )
                                        ;
                            })
                            .attr("x2", function (d) {
                                return (
                                        parseFloat(d3.select(this.parentNode).select("circle").attr('cx')) +
                                        (
                                                parseFloat(d3.select(this.parentNode).select("circle").attr('r')) -
                                                (d.lineLength / 2)
                                                ) * Math.sin(d.time * TAU));
                            })
                            .attr("y2", function (d) {
                                return (
                                        parseFloat(d3.select(this.parentNode).select("circle").attr('cy')) -
                                        (
                                                parseFloat(d3.select(this.parentNode).select("circle").attr('r')) -
                                                (d.lineLength / 2)
                                                ) * Math.cos(d.time * TAU));
                            })
                            .classed("levent", true);

                    // loops.forEach(function(l){
                    //   myLoop.draw(l.id,l.x,l.y,l.r,angles);
                    // });

                    node.call(force.drag);

                    force.on('tick', function () {
                        // console.log(node);
                        d3.selectAll("circle")
                                .attr('cx', function (d) {
                                    return xBoundary(d.x);
                                })
                                .attr('cy', function (d) {
                                    return yBoundary(d.y);
                                });

                        // no need to use the boundary function here because it's just been updating in the circles
                        // TODO: This cut & pastes from the initialiser above - remove duplication!
                        d3.selectAll(".node line")
                                .attr("x1", function (d) {
                                    // console.log();
                                    return (
                                            parseFloat(d3.select(this.parentNode).select("circle").attr('cx')) +
                                            (
                                                    parseFloat(d3.select(this.parentNode).select("circle").attr('r')) +
                                                    (d.lineLength / 2)
                                                    ) * Math.sin(d.time * TAU)
                                            )
                                            ;
                                })
                                .attr("y1", function (d) {
                                    return (
                                            parseFloat(d3.select(this.parentNode).select("circle").attr('cy')) -
                                            (
                                                    parseFloat(d3.select(this.parentNode).select("circle").attr('r')) +
                                                    (d.lineLength / 2)
                                                    ) * Math.cos(d.time * TAU)
                                            )
                                            ;
                                })
                                .attr("x2", function (d) {
                                    return (
                                            parseFloat(d3.select(this.parentNode).select("circle").attr('cx')) +
                                            (
                                                    parseFloat(d3.select(this.parentNode).select("circle").attr('r')) -
                                                    (d.lineLength / 2)
                                                    ) * Math.sin(d.time * TAU));
                                })
                                .attr("y2", function (d) {
                                    return (
                                            parseFloat(d3.select(this.parentNode).select("circle").attr('cy')) -
                                            (
                                                    parseFloat(d3.select(this.parentNode).select("circle").attr('r')) -
                                                    (d.lineLength / 2)
                                                    ) * Math.cos(d.time * TAU));
                                });

                        edge
                                .attr('x1', function (d) {
                                    return xBoundary(d.source.x);
                                })
                                .attr('y1', function (d) {
                                    return yBoundary(d.source.y);
                                })
                                .attr('x2', function (d) {
                                    return xBoundary(d.target.x);
                                })
                                .attr('y2', function (d) {
                                    return yBoundary(d.target.y);
                                });

                    });

                    force.start();

                    // d3.select("svg").append("text").attr("x",100).attr("y",105).text("1");

                    // state transition
                    var myDelay = 1200;

                    var tran = mySvg;
                    var currentLoop = 0;
                    var possibleMoves = null;
                    // 500 transitions!
                    for (var i = 0; i < 100; i++) {
                        possibleMoves = [];
                        var nextLoop = 0;

                        edges.forEach(function (d) {

                            if (d.source.index == currentLoop) {
                                possibleMoves.push(d.target);
                            } else {
                                if (d.target.index == currentLoop) {
                                    possibleMoves.push(d.source);
                                }
                            }
                        });
                        nextLoop = possibleMoves[Math.floor(Math.random() * possibleMoves.length)].index;

                        // chain another transition after the previous one completes
                        tran = tran.transition().duration(myDelay);
                        tran.selectAll("circle").style("fill-opacity", 0);
                        tran.select("circle#" + loops[nextLoop].id).style("fill-opacity", 1);
                        currentLoop = nextLoop;
                    }

                    // d3.select("text").transition().attr("x",300).duration(myDuration).delay(myDelay);
                }

                function wipe() {
                    mySvg.selectAll("svg g").remove();
                    mySvg.selectAll("svg circle").remove();
                    mySvg.selectAll("svg line").remove();
                }

                return {
                    dumpGraph: dumpGraph,
                    wipe: wipe
                };

            };


        });
    }
};