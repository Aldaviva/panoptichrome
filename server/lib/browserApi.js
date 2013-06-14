var apiServer         = require('./apiServer');
var Browser           = require('./Browser');
var BrowserConnection = require('./BrowserConnection');
var browsers          = require('./browsers');


var API_ROOT = '/cgi-bin/';

apiServer.get({ path: API_ROOT+'browsers', name: 'listBrowsers' }, function(req, res){
	res.send(browsers.toJSON());
});

apiServer.get({ path: API_ROOT+'browsers/:browserId', name: 'getBrowser' }, function(req, res){
	var browserId = req.params.browserId;
	var browser = browsers.get(browserId);
	res.send(browser.toJSON());
});

var browserSockets = apiServer.io.of('/browsers');
var adminSockets = apiServer.io.of('/admins');

browserSockets.on('connection', function(socket){
	var browserConnection = new BrowserConnection(socket);
	browserConnection.once('change:id', function(browserId){
		var browser = browsers.get(browserId);

		if(!browser){
			browser = new Browser({ id: browserId });
			browsers.add(browser);
		}

		browserConnection.bindBrowser(browser);
	});
});

browsers
	.on('add', function(model){
		model.on('change:id', function(){
			adminSockets.emit("add:browser", model.toJSON());
		});

		model.on('change', function(){
			adminSockets.emit("change:browser", model.toJSON());
		});
	})
	.on('remove', function(opts){
		adminSockets.emit('remove:browser', opts.id);
	});