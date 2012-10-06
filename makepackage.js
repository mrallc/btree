#!/usr/bin/env node

var p = {
    "name": "btree",
    "private": true,
    "version": "1.0.0",
    "author": {
	name: "mike andrews",
	email: "mra@xoba.com",
	url: "http://MichaelRaskinAndrews.com"
    },
    "homepage": "https://github.com/mrallc/btree",
    "description": "asynchronous copy-on-write btree",
    "scripts": {
	"start": "node test.js"
    },
    "dependencies": {
	"underscore": "1.4.1"
    },
    "repository": {
	"type": "git",
	"url": "git://github.com/mrallc/btree.git"
    },
    bugs: {
        "url" : "http://github.com/mrallc/btree/issues",
        "mail" : "mra@xoba.com"
    },
    "licenses": [{
        "type": "Apache License, Version 2.0",
        "url": "http://github.com/mrallc/btree/raw/master/LICENSE-2.0"
    }],
    "keywords": [
	"btree","async","copy-on-write","cow","asynchronous","database"
    ],
    "engine": {
	"node": ">=0.8.0"
    }
}

require("fs").writeFileSync("package.json",JSON.stringify(p,null,4));