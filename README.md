processCallback.js
==================

Callback-based messaging between Node.js (parent-child) processes



# Cluster code example

	var cluster = require('cluster'),
		listen = require("processCallback");

	// Master
	if( cluster.isMaster ){

		// Number of workers
		var numWorkers = require('os').cpus().length;

		// When a Worker process is up
		cluster.on('online', function( worker ){

			console.info('Worker ' + worker.process.pid + ' spawned' );

			// Bind Listener to each forked process and send "Hello"
			listen(worker).send("Hello", function(resMsg){

				// Response from worker
				console.log("Response message", resMsg); // Hello World
			});
		});

		// If a Worker process dies
		cluster.on('exit', function(worker, code, signal){

			console.info('Worker ' + worker.process.pid + ' died... respawning');

			// Respawn Worker
			cluster.fork();
		});

		// Spawn workers
		for( var i = 0; i < numWorkers; i++ ){
			cluster.fork();
		}
	}

	// Load Worker
	else {
		// Worker receives message
		listen(process, function(recMsg, replyCallback){
			
			console.log("Received message!", recMsg); // Hello

			// Send back a response
			replyCallback(recMsg + " World");
		});
	}