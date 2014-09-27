initd-node [![Build Status](https://travis-ci.org/asessa/initd-node.png)](https://travis-ci.org/asessa/initd-node)
==========

initd-node is a node.js module to create a debian based startup script for your application.

The package generates a shell script for `/etc/init.d` using start-stop-daemon.

Installation
------------

`npm install initd-node -g`

Usage
-----

To generate a startup script, use following options:

			-a, --app			Path to node.js main js file
			-e, --env			Export NODE_ENV with ENV value (default production)
			-n, --name			Application name
			-g, --group			Group
			-u, --user			User

If you don't specify any option, initd-node try to load from the package.json file on current directory.

Authors and contributors
------------------------
### Current
* [Andrea Sessa][] (Creator)

[Andrea Sessa]: https://plus.google.com/+AndreaSessa


License
-------
[MIT license](http://www.opensource.org/licenses/Mit)