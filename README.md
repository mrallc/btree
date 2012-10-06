an asynchronous copy-on-write (c.o.w.) b-tree in javascript; see
http://en.wikipedia.org/wiki/B-tree for details on b-tree's.

"asynchronous" means that all methods require a callback and return
nothing directly. in other words, this implementation is event-driven.

"cow" means that the entire b-tree is a pure immutable value,
represented by its root key. all mutations create a new root key;
i.e., a change three levels down in the b-tree causes modifications to
the upper levels as well, including creating a new root that
references that change down below.

the two main methods are "add" and "scan". "get" and "create" are
really just special cases of "add" and "scan". the b-tree relies on a
key/value store, the simplest example of which is included as "kv.js".

run "simple.js" for an ultra-simple demo, and "demo.js" for a more
involved one. 

bug reports and pull requests will be welcomed! thanks in advance.

initially inspired by Justin Wetherell's java code at
http://code.google.com/p/java-algorithms-implementation/

