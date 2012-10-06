#!/usr/bin/env node

console.log("\n\n*** ultra-simple demo of the b-tree code. for more detailed example, run demo.js.\n\n");

var tree = require("./btree").create();
var box = require("./box");

var check = function(err) {
    if (err) {
	throw err;
    }
}

tree.create(function(err0,root) {
    
    console.log("created empty tree = " + root);

    tree.add(root,{ key: "test value", payload: 123 },function(err1,root1) {

	check(err1);

	console.log("added value: " + root1);
	
	tree.print(root1,function(err,s) {

	    check(err);

	    console.log(box(s));

	    tree.add(root1,{ key: "another value", payload: 456 },function(err2,root2) {

		check(err2);
		
		tree.print(root2,function(err,s) {
		    
		    check(err);
		    console.log(box(s));

		    var done = function() {
			console.log("done scanning");
		    };

		    var cb = function(err,x) {
			check(err);
			console.log("scanned " + JSON.stringify(x));
			return true;
		    };

		    tree.scan(root2, "another value", true, cb, done);

		    tree.get(root2,"test value",function(err,data) {
			check(err);
			console.log("got: " + JSON.stringify(data));
		    });
		});

	    });
	    
	});

    });

});
