/**
 *  dfscore
 *  GPL license, see COPYING
 *  copyright 2015 richard@1bpm.net  
 */

var XMLserializer = require("xmlserializer");
var dfs=require("./dfs.js");
/**
 * recursive xml parser
 * remnant from original 0.1 XML spec
 * @param {DOMNode} theNode the node from DOMParser
 * @returns {undefined}
 */

var Node = function (node) {
    var self=this;
    this.children = [];
    this.data = {};
    this.name=null;
    this.parse = function () {
        try {
            self.name = node.nodeName;
        } catch (error) {
            dfs.log.debug("empty nodename");
        }

        // if there are attributes in the current node
        try {
            if (node.attributes) {
                for (var attributeKey in node.attributes) {
                    var attr = node.attributes[attributeKey];
                    if (attr && attr.nodeValue) {
                        self.data[attr.nodeName] = attr.nodeValue;
                    }

                }
            }
        } catch (error) {
            dfs.log.debug("empty attributes");
        }


// if the node has children
        for (var childKey in node.childNodes) {
            try {
                var child = node.childNodes[childKey];
                switch (child.nodeType) {
                    case 3:
                        self.data["innerValue"] = child.nodeValue.trim();
                        break;
                    case 1:
                        var thisChild=new Node(child)
                        self.children.push(thisChild);
                        break;
                }
            } catch (innerError) {
                dfs.log.debug("inner xml child none " + innerError);
            }
        }
        //console.log("AXE :" +JSON.stringify(self.children));
    };
    /**
     * get the tag name of the node
     * @returns {string} the tag name
     */
    this.tagName = function () {
        return node.nodeName;
    };

    this.inner = function () {
        if (node)
            return XMLserializer.serializeToString(node);
    };

    /**
     * get a named item.
     * "innerValue" is the inner text value, if any
     * @param {string} index the attribute key
     * @returns {string} attribute value
     */
    this.get = function (index) {
        return self.data[index];
    };

    this.hasChildren = function () {
        var returnVal = false;
        try {
            if (self.children.length > 0) {
                returnVal = true;
            } else {
                returnVal = false;
            }
        } catch (error) {
            returnVal = false;
        }
        return returnVal;
    };

    this.hasChild = function (tag) {
        var returnVal = false;
        try {
            var test = this.getChild(tag);
            if (test !== null) {
                returnVal = true;
            }
        } catch (error) {
            returnVal = false;
        }
        return returnVal;
    };

    this.getChild = function (tag) {
        var returnVal = null;
        this.eachChild(function (child) {
            if (child.name === tag) {
                returnVal = child;
            }
        });
        return returnVal;
    };

    /**
     * callback on each child node
     * @param {function} callback run on each child node
     * @returns {undefined}
     */
    this.eachChild = function (callback) {
        for (var child in self.children) {
            callback(self.children[child]);
        }
    };
    /**
     * get all attributes, or those specified in an array
     * "innerValue" is the inner text value, if any
     * @param {array} filter the attributes items to get
     * @returns {XMLNode.data}
     */
    this.getData = function (filter) {
        if (!filter) {
            return self.data;
        } else {
            var out = {};
            for (var item in filter) {
                out[filter[item]] = self.data[filter[item]];
            }
            return out;
        }
    };

    this.parse();
};

module.exports = Node;