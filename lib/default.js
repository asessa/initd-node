(
	function(){

		var program = require('commander');
		var swig = require('swig');
		var fs = require('fs');
		var path = require('path');

		var template = [
			'#!/bin/sh',
			'### BEGIN INIT INFO',
			'# Provides:          {{appName}}',
			'# Required-Start:    $network $syslog',
			'# Required-Stop:     $network $syslog',
			'# Default-Start:     2 3 4 5',
			'# Default-Stop:      0 1 6',
			'# Short-Description: {{appName}}',
			'# Description:       {{appName}}',
			'### END INIT INFO',
			'# PATH should only include /usr/* if it runs after the mountnfs.sh script',
			'PATH=/sbin:/usr/sbin:/bin:/usr/bin',
			'DESC={{appName}}',
			'NAME={{appName}}',
			'APP_ROOT={{appPath}}',
			'APP_GROUP={{group}}',
			'APP_USER={{user}}',
			'DAEMON={{nodePath}}',
			'DAEMON_ARGS="{{app}}"',
			'PIDFILE=/var/run/$NAME.pid',
			'SCRIPTNAME=/etc/init.d/$NAME',
			'export NODE_ENV={{env}}',
			'',
			'# Exit if the package is not installed',
			'[ -x "$DAEMON" ] || exit 0',
			'',
			'# Read configuration variable file if it is present',
			'[ -r /etc/default/$NAME ] && . /etc/default/$NAME',
			'',
			'# Load the VERBOSE setting and other rcS variables',
			'. /lib/init/vars.sh',
			'# I like to know what is going on',
			'VERBOSE=yes',
			'',
			'# Define LSB log_* functions.',
			'# Depend on lsb-base (>= 3.2-14) to ensure that this file is present',
			'# and status_of_proc is working.',
			'. /lib/lsb/init-functions',
			'',
			'#',
			'# Function that starts the daemon/service',
			'#',
			'do_start()',
			'{',
			'    # Return',
			'    #   0 if daemon has been started',
			'    #   1 if daemon was already running',
			'    #   2 if daemon could not be started',
			'    start-stop-daemon --start --quiet \\ ',
			'        --chuid $APP_USER:$APP_GROUP --chdir $APP_ROOT --background \\ ',
			'        --pidfile $PIDFILE --exec $DAEMON --test > /dev/null \\ ',
			'        || return 1',
			'    start-stop-daemon --start --quiet \\ ',
			'        --chuid $APP_USER:$APP_GROUP --chdir $APP_ROOT --background \\ ',
			'        --make-pidfile --pidfile $PIDFILE --exec $DAEMON -- $DAEMON_ARGS \\ ',
			'        || return 2',
			'    # Add code here, if necessary, that waits for the process to be ready',
			'    # to handle requests from services started subsequently which depend',
			'    # on this one.  As a last resort, sleep for some time.',
			'}',
			'',
			'#',
			'# Function that stops the daemon/service',
			'#',
			'do_stop()',
			'{',
			'    # Return',
			'    #   0 if daemon has been stopped',
			'    #   1 if daemon was already stopped',
			'    #   2 if daemon could not be stopped',
			'    #   other if a failure occurred',
			'    start-stop-daemon --stop --quiet --retry=TERM/30/KILL/5 \\ ',
			'        --pidfile $PIDFILE --exec $DAEMON',
			'    RETVAL="$?"',
			'    [ "$RETVAL" = 2 ] && return 2',
			'    # Many daemons don\'t delete their pidfiles when they exit.',
			'    rm -f $PIDFILE',
			'    return "$RETVAL"',
			'}',
			'',
			'#',
			'# Function that sends a SIGHUP to the daemon/service',
			'#',
			'do_reload() {',
			'    #',
			'    # If the daemon can reload its configuration without',
			'    # restarting (for example, when it is sent a SIGHUP),',
			'    # then implement that here.',
			'    #',
			'    start-stop-daemon --stop --signal 1 --quiet --pidfile $PIDFILE \\ ',
			'        --exec $DAEMON',
			'    return 0',
			'}',
			'',
			'case "$1" in',
			'start)',
			'        [ "$VERBOSE" != no ] && log_daemon_msg "Starting $DESC" "$NAME"',
			'        do_start',
			'        case "$?" in',
			'                0|1) [ "$VERBOSE" != no ] && log_end_msg 0 ;;',
			'                2) [ "$VERBOSE" != no ] && log_end_msg 1 ;;',
			'        esac',
			'        ;;',
			'stop)',
			'        [ "$VERBOSE" != no ] && log_daemon_msg "Stopping $DESC" "$NAME"',
			'        do_stop',
			'        case "$?" in',
			'                0|1) [ "$VERBOSE" != no ] && log_end_msg 0 ;;',
			'                2) [ "$VERBOSE" != no ] && log_end_msg 1 ;;',
			'        esac',
			'        ;;',
			'status)',
			'    status_of_proc "$DAEMON" "$NAME" && exit 0 || exit $?',
			'    ;;',
			'reload|force-reload)',
			'        log_daemon_msg "Reloading $DESC" "$NAME"',
			'        do_reload',
			'        log_end_msg $?',
			'        ;;',
			'restart|force-reload)',
			'        log_daemon_msg "Restarting $DESC" "$NAME"',
			'        do_stop',
			'        case "$?" in',
			'        0|1)',
			'                do_start',
			'                case "$?" in',
			'                        0) log_end_msg 0 ;;',
			'                        1) log_end_msg 1 ;; # Old process is still running',
			'                        *) log_end_msg 1 ;; # Failed to start',
			'                esac',
			'                ;;',
			'        *)',
			'                # Failed to stop',
			'                log_end_msg 1',
			'                ;;',
			'        esac',
			'        ;;',
			'*)',
			'        echo "Usage: $SCRIPTNAME {start|stop|status|restart|reload|force-reload}" >&2',
			'        exit 3',
			'        ;;',
			'esac',
			':'
		].join('\n');

		/**
		 * 	Daemon definition
		 */
		var Daemon = function(){
			this.init();
		};

		Daemon.prototype = {

			/**
			* Load package.json file
			*
			* @method init
			*/

			init: function(){
				// Find and load package.json from which the node command is invoked.
				this.packageInfo = {
					info: false,
					name: "",
					appjs: ""
				};

				try{
					var package = require(process.cwd() + '/package.json');
					if(package.main && package.name) {
						this.packageInfo.info = true;
						this.packageInfo.name = package.name;
						this.packageInfo.appjs = package.main;
					}
				}
				catch(err) {}

				// Create default options value
				this.options = {
					appName: this.packageInfo.name,
					app: path.join(process.cwd() + '/' + this.packageInfo.appjs),
					appPath: process.cwd(),
					group: process.getgid(),
					user: process.getuid(),
					env: 'production',
					nodePath: process.execPath
				};

				// Create options parsing
				program
					.version('0.0.3')
					.option('-a, --app [path]', 'Path to node.js main file')
					.option('-e, --env [value]', 'Export NODE_ENV with value (default production)')
					.option('-n, --appName [value]', 'Application name')
					.option('-g, --group [value]', 'Group (default current user id)')
					.option('-u, --user [value]', 'User (default current group id)')
					.option('-p, --path [value]', 'Path to node.js executable (default current instance)');
			},

			/**
			* Generate script file daemon
			*
			* @method script
			* @param {Array} 		process_argv	process.arv
			* @param {Function} 	callback		function
			*/
			script: function(process_argv,callback) {

				// Exception handler
				if (arguments.length !== 2)
					throw new Error('No valid args for script(process_argv,callback)');
				else {
					// init parameters
					var callback = this.checkCallback(callback) ? callback : null;

					// Check paramaters
					if(!this.checkCallback(callback))
						throw new Error('No valid args for callback parameters | script(process_argv,callback)');
				}

				// Success on args
				this.process_argv = process_argv;
				this.callback = callback;

				// Parse arguments
				this.parseArguments();

				// Write files
				this.writeFiles();
			},

			/**
			* Parse args and define some booleans
			*
			* @method 				writeDaemonfile
			*/
			parseArguments: function(){

				this.no_options = false;

				program.parse(this.process_argv);

				if (!program.app && !program.env && !program.appName && !program.group && !program.user)
					this.no_options = true;

				if (program.app)
					this.options.app = program.app;
				if (program.appName)
					this.options.appName = program.appName;
				if (program.env)
					this.options.env = program.env;
				if (program.group)
					this.options.group = program.group;
				if (program.user)
					this.options.user = program.user;
				if (program.path)
					this.options.nodePath = program.path;

				return;
			},

			/**
			* Test callback function
			*
			* @method 				checkCallback
			* @param {Function} 	callback				function
			*/
			checkCallback:function (callback){

				if (callback && typeof(callback) === "function")
					return true;
				else
					return false;
			},
			/**
			* Write shell script daemon file
			*
			* @method 				writeDaemonfile
			*/
			writeFiles: function(){
				// Check if options are available from parameters || packageInfo
				if(this.no_options === true && this.packageInfo.info === false)
					return this.callback(new Error('No options specified AND package.json not found'));

				var self = this;

				// write daemon file
				var tpl = swig.compile(template);
				var file = tpl(this.options);

				fs.writeFile(this.options.appName, file, function (err) {
					self.callback(err, "Script daemon file saved to " + self.options.appName);
				});
			}
		};

		module.exports = new Daemon();
	}
)();