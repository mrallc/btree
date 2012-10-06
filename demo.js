#!/usr/bin/env node

// a tree tester

var _ = require("underscore");

var keyName = "key";
var payloadName = "payload";

var config = (function() {
    
    var childSum = function(children,n) {
	var total = 0;
	for (var i=0; i<children.length; i++) {
	    var x = children[i][n];
	    if (x !== undefined) {
		total += x;
	    }
	}
	return total;
    }

    return {

	order: 2,

	kv: require("./kv"),

	canReplacePayloads: true,

	keyExtractor: function(a) {
	    if (a === undefined || a === null) {
		return undefined;
	    } else {
		return a[keyName];
	    }
	},

	keyComparator: function(a,b) {
	    a = a.toString();
	    b = b.toString();
	    if (a<b) {
		return -1;
	    } else if (a>b) {
		return +1;
	    } else {
		return 0;
	    }
	},

	aggs: {

	    keyCount: function(keys,children) {
		var total = keys.length;
		return total + childSum(children,"keyCount");
	    },

	    deleted: function(keys,children) {
		var total = 0;
		for (var i=0; i<keys.length; i++) {
		    if (keys[i].deleted) {
			total++;
		    }
		}
		return total + childSum(children,"deleted");
	    },

	    payloadSum: (function() {
		var round = function(x) {
		    return parseFloat(x.toFixed(3));
		}
		return function(keys,children) {
		    var total = 0;
		    for (var i=0; i<keys.length; i++) {
			total += keys[i][payloadName];
		    }
		    return round(total + childSum(children,"payloadSum"));
		};
	    })()
	    
	},
	
	// for printing nodes only (i.e., debugging)
	keysToString: function(keys) {
	    var out = [];
	    _.each(keys,function(x) {
		out.push(x[keyName] + "(" + x[payloadName] + ")");
	    });
	    return out.join(", ");
	}

    };
})();


var tree = require("./btree").create(config);

function shuffle(list) {
    var i, j, t;
    for (i = 1; i < list.length; i++) {
	j = Math.floor(Math.random()*(1+i));  
	if (j != i) {
	    t = list[i];                      
	    list[i] = list[j];
	    list[j] = t;
	}
    }
}

var line = function(x) {
    var out = [];
    for (var i=0; i<x; i++) {
	out.push("-");
    }
    console.log(out.join(""));
}


var lim = function(n,list) {
    var out = [];
    for (var i = 0; i< ( n || list.length) ; i++) {
	var x = list[i];
	if (x !== undefined) {
	    out.push(x);
	}
    }
    return out;
};

var f = function(root) {

    console.log("final result: " + root);

    tree.print(root,function(err,x) {

	if (err) {
	    throw err;
	}
	
	console.log(require("./box")(x));
	

	var done = function() { 
	    console.log("DONE SCANNING; total = " + total); 
	};
	
	var cb =  (function() { 
	    var i = 0;
	    return function(err,x) {
		if (err) {
		    throw err;
		}
		console.log(++i + ". scanned " + JSON.stringify(x));
		var out =  x[keyName] < 'L';
		if (!out) {
		    done();
		}
		return out;
	    };
	})();

	tree.scan(root, "D", true, cb, done );
	
    });
};

var payloadGen = function() {
    var x = parseFloat(Math.random().toFixed(3));
    total += x;
    return x;
};

var values = (function() {

    // inspired by http://cis.stvincent.edu/html/tutorials/swd/btree/btree.html
    
    var list = lim(25,"CNGAHEKQMFWLTZDPRXYS".split(""));
    
    if (false) {
	for (var i=0; i<200; i++) {
	    i = "000" + i;
	    i = i.substring(i.length-3,i.length);
	    list.push("X" + i);
	}
	shuffle(list);
    }

    console.log("going to add keys: " + list);

    var values = [];
    _.each(list,function(item) {
	var o = { };		
	o[keyName] = item;
	o[payloadName] = payloadGen();
	values.push(o);
    });

    var del = function(i) {
	var o = {};
	o[keyName] = i;
	o[payloadName] = 0.999;
	o.deleted = true;
	values.push(o);
    };

    if (config.canReplacePayloads) {
	
	// deletion is handled in the client; i.e., keys stay in b-tree, but payloads are modified:
	
	del("H");
	del("M");
	del("L");
	del("T");
    }
    
    return values;

})();

var total = 0;

for (var i=0; i<values.length; i++) {

    var g = (function(item) {
	return function(next) {
	    return function(root) {

		console.log("adding " + JSON.stringify(item) +" ---");

		tree.add(root,item,function(err, root1) {

		    if (err) {
			throw err;
		    }

		    console.log({added: item, root: root1 });

		    tree.print(root1,function(err,x) {
			console.log(require("./box")(x));
			next(root1);
		    });

		});
	    };
	};
    })(values[values.length-i-1]);

    f = g(f);
}

tree.create(function(err,root) {
    if (err) {
	throw err;
    }
    console.log("root = " + root);
    f(root);
});

