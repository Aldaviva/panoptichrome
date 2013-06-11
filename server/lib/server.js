var _                 = require('lodash');
var Backbone          = require('backbone');
var Browser           = require('./Browser');
var BrowserConnection = require('./BrowserConnection');
var lessMiddleware    = require('less-middleware');
var restify           = require('restify');
var socketio          = require('socket.io');

var SERVER_PORT = 8081;
var API_ROOT = '/cgi-bin/';

var server = module.exports = restify.createServer();
var io = server.io = socketio.listen(server, {
	'log level': 1, // 0 - error, 1 - warn, 2 - info, 3 - debug
	'transports': ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']
});

var browsers = new Backbone.Collection([], { model: Browser });

var browserSockets = server.io.of('/browsers');
var adminSockets = server.io.of('/admins');

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

server.get({ path: API_ROOT+'browsers', name: 'listBrowsers' }, function(req, res){
	res.send(browsers.toJSON());
});

server.get({ path: API_ROOT+'browsers/:browserId', name: 'getBrowser' }, function(req, res){
	var browserId = req.params.browserId;
	var browser = browsers.get(browserId);
	res.send(browser.toJSON());
});

server.use(lessMiddleware({
	src: '../ui',
	force: true,
	debug: true
}));

server.get(/\/?.*/, restify.serveStatic({
	directory: '../ui'
}));

server.listen(SERVER_PORT, function(err){
	if(err != null){
		console.error(err);
	} else {
		console.info("Listening on %s.", server.url);

		io.enable('browser client minification');
		io.enable('browser client etag');
		io.enable('browser client gzip');
	}
});
