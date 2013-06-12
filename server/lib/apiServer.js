var Browser           = require('./Browser');
var BrowserConnection = require('./BrowserConnection');
var browsers          = require('./browsers');
var restify           = require('restify');
var socketio          = require('socket.io');

var apiServer = module.exports = restify.createServer();

apiServer.use(restify.gzipResponse());
//apiServer.use(restify.bodyParser());

var io = module.exports.io = socketio.listen(apiServer, {
	'log level': 1, // 0 - error, 1 - warn, 2 - info, 3 - debug
	'transports': ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']
});

var browserSockets = io.of('/browsers');
var adminSockets = io.of('/admins');

browserSockets.on('connection', function(socket){
	var browserConnection = new BrowserConnection(socket);
	browserConnection.once('change:id', function(browserId){
		var browser = browsers.get(browserId);

		if(!browser){
			browser = new Browser({ id: browserId });
			browsers.add(browser);
		}

		browser.connection = browserConnection;
		browserConnection.setBrowser(browser);
	});
});

browsers.on('add', function(model){
	adminSockets.emit("add:browser", model.toJSON());

	model.on('change', function(){
		adminSockets.emit("change:browser", model.toJSON());
	});
});