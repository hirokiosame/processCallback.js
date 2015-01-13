module.exports = (function(){

	'use strict';

	function processCallback(_process, masterCallback){

		var self = this;

		// To uniquify every binding -- so a response to one binding doesn't get caught by another
		this.hash = Math.random().toString(36).substr(2, 5);

		// To uniquify every callback
		this.id = 0;

		// Store Callbacks
		this.callbacks = {};

		// Store Events
		this.events = {};

		// Reference listening to
		this.listeningTo = _process;

		// Bind master callback
		this.masterCallback = null;
		this.recv(masterCallback);

		// Bind Event to Process
		_process.on("message", function(data){

			// If not a valid message, dismiss
			if( typeof data !== "object" || data === null ){ return; }

			// Event -- trigger events
			if( data.hasOwnProperty("event") && self.events[data.event] ){
				self.events[data.event].forEach(function(callback){
					callback.apply(null, data.arguments);
				});
			}

			// Direct message
			if( data.hasOwnProperty("replyTo") ){

				// Response -- trigger response callback
				if( typeof self.callbacks[data.replyTo] === "function" ){

					// Return to message
					self.callbacks[data.replyTo](data.message);

					// Remove from memory
					self.callbacks[data.replyTo] = null;

					return;
				}

				// Request - trigger master callback
				if( self.masterCallback ){
					self.masterCallback(data.message, function reply(message){
						_process.send({
							"replyTo": data.replyTo,
							"message": message
						})
					});
				}
			}
		});
	}


	// Direct message
	
	processCallback.prototype.send = function send(message, callback){

		// Callback is necessary
		if( typeof callback !== "function" ){ throw new Error("Callback missing"); }

		var hashId = this.hash + this.id++;

		// Store callback
		this.callbacks[hashId] = callback;

		// Make request
		this.listeningTo.send({
			"replyTo": hashId,
			"message": message
		});

		return this;
	};

	processCallback.prototype.recv = function recv(masterCallback){

		// Callback necessary
		if( typeof masterCallback !== "function" ){ return false; }

		// Store
		this.masterCallback = masterCallback;

		return this;
	};


	// Events emitter

	processCallback.prototype.on = function(eventName, callback){

		// Validate
		if( typeof eventName !== "string" || typeof callback !== "function" ){ return; }

		// Store
		(this.events[eventName] || (this.events[eventName] = [])).push(callback);

		return this;
	};

	processCallback.prototype.emit = function(eventName){

		var args = Array.prototype.slice.call(arguments, 1);

		this.listeningTo.send({
			"event": eventName,
			"arguments": args
		});

		return this;
	};

	return function(_process, masterCallback){
		return new processCallback(_process, masterCallback);
	};
})();