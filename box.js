var _ = require("underscore");

// just puts a "box" around a string

var margin = " ";
var tab = "    ";

module.exports = function(str) {

    var width = 0;

    var file = [];
    _.each(str.split("\n"),function(line) {
	line = line.replace(/\t/g,tab);
	var len = line.length;
	if (len > 0) {
	    if (len > width) {
		width = len;
	    }
	}
	file.push(line);
    });

    var horizontal = function() {
	var line = [];
	line.push("+");
	for (var i = 0; i<width+2*margin.length; i++) {
	    line.push("-");
	}
	line.push("+");
	return line.join("");
    };

    var lines = [];

    lines.push(horizontal());

    _.each(file,function(line) {
	if (line.length < width) {
	    var whiteSpace = [];
	    for (var i=0; i<width-line.length; i++) {
		whiteSpace.push(" ");
	    }
	    line += whiteSpace.join("");
	}
	lines.push("|" + margin + line + margin + "|");
    });

    lines.push(horizontal());

    return lines.join("\n");

};

