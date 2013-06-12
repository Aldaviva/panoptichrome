var apiServer      = require('./apiServer');
var lessMiddleware = require('less-middleware');
var restify        = require('restify');

apiServer.use(lessMiddleware({
	src: 'ui',
	force: true,
	debug: false
}));

var serveNodeModules = restify.serveStatic({
	directory: 'node_modules',
	maxAge: 3600
});

apiServer.get({ path: /\/scripts\/node_modules\/(.+)/, name: 'nodeModules' }, function(req, res, next){
	req._path = req.params[0];
	serveNodeModules(req, res, next);
});

var serveBrowserModel = restify.serveStatic({
	directory: './server/',
	maxAge: 3600
});

apiServer.get({ path: /\/scripts\/lib\/(.+)/, name: 'browserModel' }, function(req, res, next){
	req._path = 'lib/'+req.params[0];
	serveBrowserModel(req, res, next);
});

apiServer.get(/\//, restify.serveStatic({
	directory: 'ui',
	maxAge: 1,
	default: 'index.html'
}));

apiServer.get(/\/?.*/, restify.serveStatic({
	directory: 'ui',
	maxAge: 3600
}));