var restify           = require('restify');
var socketio          = require('socket.io');

var apiServer = module.exports = restify.createServer();

apiServer.use(restify.gzipResponse());
apiServer.use(restify.bodyParser({ mapParams: false }));

var io = module.exports.io = socketio.listen(apiServer, {
	'log level': 1, // 0 - error, 1 - warn, 2 - info, 3 - debug
	'transports': ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']
});

