### asynchronous copy-on-write b-tree in javascript

see http://en.wikipedia.org/wiki/B-tree for details on b-tree's. 
they're a fundamental building-block of databases or "big data," and one of the best
and most powerful ways known to mankind for enabling random access
to large structures.

to install the b-tree code and then run a simple demo using node/npm.js @ https://npmjs.org/package/btree ---

    npm install btree
    npm start btree
    
"asynchronous" means that all methods require a callback and return
nothing directly. in other words, this implementation is completely
non-blocking, event-driven, and thus naturally high-performance.

"copy-on-write" (cow) means that the entire b-tree is a pure immutable value,
represented by its root key. all mutations create a new root object;
i.e., a new version three levels down in the b-tree creates new versions of nodes in
the upper levels as well, including creating the new root which
references that change down below. 

the two main methods are `add` and `scan`; `get` and `create` are
really just special cases. the b-tree relies on a
key/value store, the simplest example of which is included as `kv.js`.

run `simple.js` for an ultra-simple demo, and `demo.js` for a more
involved one. 

bug reports and pull requests will be welcomed! thanks in advance.

initially inspired by Justin Wetherell's java code at
http://code.google.com/p/java-algorithms-implementation/

