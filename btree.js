var _ = require("underscore");

var config = {
    firstKeyFieldName: 'f',
    keysFieldName: 'k',
    childrenFieldName: 'c',
    idFieldName: 'i',
    aggsFieldName: 'a'
};

if (true) {

    // disable this section for tiny field names

    config = (function() {
	var out = {};
	_.each(config,function(v,k) {
	    out[k] = k;
	});
	return out;
    })();
}

var firstKeyFieldName = config.firstKeyFieldName;
var keysFieldName = config.keysFieldName;
var childrenFieldName = config.childrenFieldName;
var idFieldName = config.idFieldName;
var aggsFieldName = config.aggsFieldName;

var newSelf = function() {
    var self = {};
    self[keysFieldName] = [];
    self[childrenFieldName] = [];
    return self;
};

var defaultArgs = {
    order: 2,
    kv: require("./kv"),
    canReplacePayloads: true,
    keyExtractor: function(a) {
	if (a === undefined || a === null) {
	    return undefined;
	} else {
	    return a.key;
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
    keysToString: function(keys) {
	var out = [];
	_.each(keys,function(x) {
	    out.push(x.key);
	});
	return out.join(", ");
    },
    aggs: {}
};

var getArg = function(args,item) {
    var arg =  args[item] || defaultArgs[item];
    if (!arg) {
	throw new Error("need arg: " + item);
    }
    return arg;
}

var create = function(args) {

    if (!args) {
	args = defaultArgs;
    }

    var order = getArg(args,"order");

    if (order < 2) {
	throw new Error("order must be 2 or greater");
    }

    var minKeySize = order;
    var minChildrenSize = minKeySize + 1;
    var maxKeySize = 2 * minKeySize;
    var maxChildrenSize = maxKeySize + 1;

    var kex = getArg(args,"keyExtractor");
    var rawKeyComparator = getArg(args,"keyComparator");

    var keyComparator = (function() {
	return function(a,b) {
	    return rawKeyComparator(kex(a),kex(b));
	};
    })();

    var childComparator = function(a,b) {
	return rawKeyComparator(a[firstKeyFieldName],b[firstKeyFieldName]);
    };
    
    var aggs = (function() {

	var aggs = [];

	aggs.push({
	    name: firstKeyFieldName,
	    type: 'core',
	    priority: 0,
	    f: function(keys) {
		if (keys.length > 0) {
		    return kex(keys[0]);
		}
	    }
	});

	_.each(getArg(args,"aggs"),function(v,k) {
	    aggs.push({name: k, type: 'client', priority: 1, f: v});
	});

	aggs.sort(function(a,b) {
	    return a.priority - b.priority;
	});

	var names = {};

	_.each(aggs,function(x) {
	    var n = x.name;
	    if (names[n]) {
		throw new Error("duplicate name: " + n);
	    }
	    names[n] = true;
	});

	return aggs;

    })();
    
    var kv = getArg(args,"kv");
    
    function Node(_self) {
	
	var self = _self ? _self : newSelf();
	
	if (typeof self !== 'object') {
	    throw "self not an object";
	};
	
	var keys = self[keysFieldName];
	var children = self[childrenFieldName];
	
	this.store = function(cb) {
	    
	    kv.add(self,function(err,key) {

		if (err){
		    cb(err);
		} else {
		    var o = { };
		    o[idFieldName] = key;
		    
		    _.each(aggs,function(agg) {

			var k = agg.name;

			var ca = [];
			
			_.each(children,function(c) {
			    ca.push(c[aggsFieldName]);
			});

			var a = agg.f(keys,ca);

			if (agg.type === 'core') {
			    o[k] = a;
			} else {
			    if (!o[aggsFieldName]) {
				o[aggsFieldName] = {};
			    }
			    o[aggsFieldName][k] = a;
			}
		    });
		    
		    cb(null,o);
		}

	    });
	};

	this.getKey = function(i) {
	    return keys[i];
	};
	
	this.addKey = function(v) {
	    keys.push(v);
	    keys.sort(keyComparator);
	};

	this.resetKey = function(v) {
	    for (var i=0; i<keys.length; i++) {
		if (keyComparator(v,keys[i]) === 0) {
		    keys[i] = v;
		}
	    }
	}

	this.numberOfKeys = function() {
	    return keys.length;
	};

	this.getChild = function(i) {
	    return children[i];
	};
	
	this.addChild = function(child) {
	    children.push(child);
	    children.sort(childComparator);
	};

	this.removeChild = function(childID) {
	    if (!childID) {
		throw "can't remove undefined child";
	    }

	    var found = false;
	    if (children.length === 0) {
		return found;
	    }
	    for (var i=0; i<children.length; i++) {
		if (children[i][idFieldName]===childID) {
		    found = true;
		} else if (found) {
		    children[i-1] = children[i];
		}
	    }
	    if (found) {
		children.length--;
	    }
	    return found;
	};
	
	this.replaceChild = function(oldChildID, newChild) {
	    if (!oldChildID) {
		throw "can't remove undefined child";
	    }
	    for (var i=0; i<children.length; i++) {
		if (children[i][idFieldName] === oldChildID) {
		    children[i] = newChild;
		}
	    }
	};
	
	this.numberOfChildren = function() {
	    return children.length;
	};

	this.toString = function(cb,prefix,isTail) {

	    if (!prefix) {
		prefix = "";
	    }

	    if (isTail === undefined) {
		isTail = true;
	    }
	    
	    var lines = [];
	    lines.push(prefix + (isTail ? "└── " : "├── ")+ getArg(args,"keysToString")(keys));
	    
	    (function pc(i) {
		
		if (i < children.length) {
		    
		    kv.get(children[i][idFieldName],function(err,data) {
			if (err) {
			    cb(err);
			} else {
			    var c = new Node(data);
			    c.toString(function(err,y) {
				lines.push(y);
				pc(i+1);
			    }, prefix + (isTail ? "    " : "│   "), i===children.length-1);
			}
		    });

		    
		} else {
		    cb(null, lines.join("\n"));
		}
		
	    })(0);
	    
	};
	
    };

    var print = function(root,cb) {
	kv.get(root,function(err,data) {
	    if (err) {
		cb(err);
	    } else {
		new Node(data).toString(cb);
	    }
	});
    };


    var cow = function(path, node, cb) {
	
	if (path.length === 1) {
	    cb(null,node[idFieldName]);
	} else {
	    
	    var parent = path[path.length-2];
	    var repl = path[path.length-1];

	    kv.get(parent,function(err,data) {
		var parentNode = new Node(data);
		
		parentNode.replaceChild(repl,node);

		parentNode.store(function(err,key) {
		    var newID = key[idFieldName];
		    cow(path.slice(0,path.length-1),key,cb);
		});
	    });
	}

    };

    var split = function(path,nodeID,cb) {
	
	kv.get(nodeID,function(err,data) {

	    var node = new Node(data);
	    
	    var size = node.numberOfKeys();
	    var medianIndex = Math.floor(size / 2);
	    var medianValue = node.getKey(medianIndex);

	    var left = new Node();
	    var right = new Node();

	    (function() {
		for (var i=0; i<medianIndex; i++) {
		    left.addKey(node.getKey(i));
		}
	    })();

	    (function() {
		if (node.numberOfChildren() > 0) {
 		    for (var j = 0; j <= medianIndex; j++) {
			left.addChild(node.getChild(j));
		    }
		}
	    })();

	    (function() {
		for (var i = medianIndex + 1; i < size; i++) {
		    right.addKey(node.getKey(i));
		}
	    })();

	    if (node.numberOfChildren() > 0) {
		(function() {
		    for (var j = medianIndex + 1; j < node.numberOfChildren(); j++) {
			right.addChild(node.getChild(j));
		    }
		})();
	    }

	    var pipeline = (function() {

		var calls = [];

		return function(args) {
		    
		    calls.push(args);

		    if (calls.length === 2) {

			var leftKey, rightKey;
			
			_.each(calls,function(x) {
			    if (x.left) {
				leftKey = x.left.key;
			    } else {
				rightKey = x.right.key;
			    }
			});
			
			if (path.length === 1) {
			    
			    // splitting the root node
			    
			    var newRoot = new Node();
			    newRoot.addKey(medianValue);

			    newRoot.addChild(leftKey);
			    newRoot.addChild(rightKey);

			    newRoot.store(function(err,key) {
				cb(null,key[idFieldName]);
			    });
			    
			} else {

			    var parentID = path[path.length-2];
			    var oldNodeID = path[path.length-1];

			    kv.get(parentID,function(err,data) {
				
				var parent = new Node(data);

				parent.addKey(medianValue);
				parent.removeChild(oldNodeID);

				parent.addChild(leftKey);
				parent.addChild(rightKey);

				parent.store(function(err,parentKey) {
				    
				    var newParentID = parentKey[idFieldName];

				    var parentPath = path.slice(0,path.length-1);

				    if (parent.numberOfKeys() > maxKeySize) {
					split(parentPath, newParentID,cb);
				    } else {
					cow(parentPath,parentKey,cb);
				    }
				    
				});

			    });
			}
		    }
		};
	    })();

	    left.store(function(err,key) {
		pipeline({left: {err: err, key: key}});
	    });
	    right.store(function(err,key) {
		pipeline({right: {err: err, key: key}});
	    });
	});
    };
    
    var add = function(path,value,cb) {

	if (typeof path === 'string') {
	    path = [ path ];
	}
	
	var recurse = (function() {
	    var done = false;
	    return function(id) {
		if (!done) {
		    // only one call per add(...)
		    done = true;
		    kv.get(id,function(err,data) {
			if (err) {
			    cb(err);
			} else {
			    var copy = path.slice();
			    copy.push(id);
			    add(copy,value,cb);
			}
		    });
		}
	    };
	})();
	
	var keyExists = function(node,key) {
	    for (var i = 0; i < node.numberOfKeys(); i++) {
		if (keyComparator(key,node.getKey(i)) === 0) {
		    return true;
		}
	    }
	    return false;
	};
	
	kv.get(path[path.length-1],function(err,data) {

	    if (err){
		cb(err);
	    } else {
		var node = new Node(data);

		if (keyExists(node,value)) {
		    if (getArg(args,"canReplacePayloads")) {
			// replace the item
			node.resetKey(value);
			node.store(function(err,key) {
			    if (err) {
				cb(err);
			    } else {
				cow(path,key,cb);
			    }
			});
		    } else {
			cb(new Error("adding a duplicate " + JSON.stringify(value)));
		    }
		} else {

		    if (node.numberOfChildren() === 0) {
			
			node.addKey(value);
			
			node.store(function(err,key) {
			    if (err) {
				cb(err);
			    } else {
				if (node.numberOfKeys() <= maxKeySize) {
				    cow(path,key,cb);
				} else {
				    split(path,key[idFieldName],cb);
				}
			    }
			});

		    } else {
			
			var least = node.getKey(0);
			var greatest = node.getKey(node.numberOfKeys()-1);
			
			if (keyComparator(value,least) < 0) {
			    recurse(node.getChild(0)[idFieldName]);
			} else if (keyComparator(value,greatest) > 0) {
			    recurse(node.getChild(node.numberOfChildren()-1)[idFieldName]);
			} else {
			    for (var i = 1; i < node.numberOfKeys(); i++) {
				var prev = node.getKey(i - 1);
				var next = node.getKey(i);
				if (keyComparator(value,prev) > 0 && keyComparator(value,next) < 0) {
				    var id = node.getChild(i)[idFieldName];
				    recurse(id);
				} 			
			    }
			}
		    }
		}
	    }
	});
    };
    
    var scan = function(root, value, ascending, cb, done) {
	
	kv.get(root,function(err,data) {
	    
	    if (err) {
		cb(err);
	    } else {
		var node = new Node(data);
		
		(function loop(i,n) {

		    var j = (ascending ? i : n-i-1);

		    var lesser = (j === 0 ? node.getChild(j) : undefined);
		    var key = node.getKey(j);
		    var greater = node.getChild(j+1);
		    
		    if (!ascending) {
			var tmp = lesser;
			lesser = greater;
			greater = tmp;
		    }

		    var comp = (ascending ? +1 : -1) * rawKeyComparator(value, kex(key));
		    
		    var doGreater = function(next) {
			if (greater) {
			    scan(greater[idFieldName],value,ascending,cb,next);
			} else {
			    next();
			}
		    };

		    var looper = function() {
			if (i<n-1) {
			    loop(i+1,n);
			} else {
			    if (done) {
				done();
			    }
			}
		    };

		    if (comp<0) {
			if (lesser) {
			    scan(lesser[idFieldName],value,ascending,cb,function() {
				if (cb(null,key)) {
				    doGreater(looper);
				}
			    });
			} else {
			    if (cb(null,key)) {
				doGreater(looper);
			    }
			}
		    } else if (comp === 0) {
			if (cb(null,key)) {
			    doGreater(looper);
			}
		    } else if (comp > 0) {
			doGreater(looper);
		    }
		    

		})(0,node.numberOfKeys());
	    }
	});

    };
    
    var get = function(root,value,cb) {
	var done = function() {
	    cb(null,null);
	}
	scan(root,value,true, function(err,x) {
	    if (err) {
		cb(err);
	    }
	    if (kex(x) === value) {
		cb(null,x);
	    } else {
		done();
	    }
	    return false;
	}, done);
    };
    
    return {

	kv: kv, 

	add: add,

	get: get,
	scan: scan,
	
  	create: function(cb) {
	    new Node().store(function(err,node) {
		if (err) {
		    cb(err);
		} else {
		    cb(null,node[idFieldName]);
		}
	    });
	},

	print: print,
    };
    
};

module.exports = {
    create: create
};
