var socketio = require('socket.io');
var restify = require('restify');

var SERVER_PORT = 8081;

var server = restify.createServer();

server.on('sockets_listening', function(){
	console.info("Sockets ready.");
	server.io.sockets.on('connection', function(socket){
		socket.emit('alert', { body: 'Hello there!' });

		socket.on('alert', function(msg){
			console.log(msg.body);
		});
	});
});

server.listen(SERVER_PORT, function(err){
	if(err != null){
		console.error(err);
	} else {
		console.info("Listening on %s.", server.url);

		var io = server.io = socketio.listen(server, {
			'log level': 1, // 0 - error, 1 - warn, 2 - info, 3 - debug
			'transports': ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']
		});

		io.enable('browser client minification');
		io.enable('browser client etag');
		io.enable('browser client gzip');

		server.emit('sockets_listening');
	}
});
