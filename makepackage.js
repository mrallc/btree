#!/usr/bin/env node

var p = {
    name: "btree",
    version: "1.0.1",
    author: {
	name: "mike andrews",
	email: "mra@xoba.com",
	url: "http://MichaelRaskinAndrews.com"
    },
    homepage: "https://github.com/mrallc/btree",
    description: "asynchronous copy-on-write btree",
    scripts: {
	start: "node simple.js"
    },
    dependencies: {
	underscore: "1.4.1"
    },
    repository: {
	type: "git",
	url: "git://github.com/mrallc/btree.git"
    },
    bugs: {
        url : "http://github.com/mrallc/btree/issues",
        mail : "mra@xoba.com"
    },
    licenses: [{
        type: "Apache License, Version 2.0",
        url: "http://github.com/mrallc/btree/raw/master/LICENSE-2.0"
    }],
    keywords: [
	"btree","async","copy-on-write","cow","asynchronous","database","big data","b-tree","data structure"
    ],
    engine: {
	node: ">=0.8.0"
    }
}

require("fs").writeFileSync("package.json",JSON.stringify(p,null,4));
