var _ = require("underscore");

module.exports = function(str) {
    
    var margin = " ";
    
    var file = [];

    var x = 0;
    _.each(str.split("\n"),function(z) {
	z = z.replace(/\t/g,"    ");
	var len = z.length;
	if (len > 0) {
	    if (len > x) {
		x = len;
	    }
	}
	file.push(z);
    });


    var lines = [];

    var tb = function() {
	var line = [];
	line.push("+");
	for (var i = 0; i<x+2*margin.length; i++) {
	    line.push("-");
	}
	line.push("+");
	return line.join("");
    };

    lines.push(tb());
    _.each(file,function(z) {
	if (z.length < x) {
	    var ws = [];
	    for (var i=0; i<x-z.length; i++) {
		ws.push(" ");
	    }
	    z+=ws.join("");
	}
	lines.push("|" + margin + z + margin + "|");
    });

    lines.push(tb());

    return lines.join("\n");
};
