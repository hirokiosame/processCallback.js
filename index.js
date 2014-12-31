module.exports = (function(){

	'use strict';

	return function(_process, masterCallback){

		var	hash = Math.random().toString(36).substr(2, 5), // To uniquify every binding
			id = 0, // To uniquify every callback
			callbacks = {},

			publicMethods = {
				"listeningTo": _process.process && _process.process.pid,
				"send": function send(message, callback){

					// Callback is necessary
					if( typeof callback !== "function" ){ throw new Error("Callback missing"); }

					var hashId = hash + id++;

					// Store callback
					callbacks[hashId] = callback;

					// Pass Message
					_process.send({
						"id": hashId,
						"message": message
					});
				}
			};

		// Bind Event to Process
		_process.on("message", function(data){

			// If not a valid message, dismiss
			if(
				typeof data !== "object" || data === null ||
				typeof data.id !== "string" ||
				!data.hasOwnProperty("message")
			){ return; }

			// If callback exists, it is in response to a message
			if( typeof callbacks[data.id] === "function" ){

				// Return to message
				callbacks[data.id](data.message);

				// Remove from memory
				return callbacks[data.id] = null;
			}

			// If master callback has been defined, pass it in there
			if( typeof masterCallback === "function" ){
				masterCallback(data.message, function(message){
					_process.send({
						"id": data.id,
						"message": message
					})
				});
			}
		});

		return publicMethods;
	};
})();