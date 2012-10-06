var crypto = require("crypto");

// a simple in-memory key/value store, useless for any real-world application

var hash = function(x) {
    var shasum = crypto.createHash('sha1');
    shasum.update(x);
    return shasum.digest('hex');
};

var cache = {};

var async = function(cb,err,response) {
    
    var run = function() {
	cb(err,response);
    }

    setTimeout(run,Math.round(1*Math.random()));
};

module.exports = {

    add: function(json,cb) {
	var v = JSON.stringify(json);
	var key = hash(v);
	cache[key] = v;
	console.log({kv_stored: key, value: v});
	async(cb,null,key);
    },

    get: function(key,cb) {
	try {
	    if (cache[key]) {
		async(cb,null,JSON.parse(cache[key]));
	    } else {
		throw new new Error("no such key " + key);
	    }
	} catch (err) {
	    async(cb,err);
	}
    }

};