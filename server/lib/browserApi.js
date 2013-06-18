var _                 = require('lodash');
var apiServer         = require('./apiServer');
var Browser           = require('./Browser');
var BrowserConnection = require('./BrowserConnection');
var browsers          = require('./browsers');

var API_ROOT = '/cgi-bin/';

var screenshots = {};

var browserSockets = apiServer.io.of('/browsers');
var adminSockets = apiServer.io.of('/admins');


apiServer.get({ path: API_ROOT+'browsers', name: 'listBrowsers' }, function(req, res){
	res.send(browsers.toJSON());
});

apiServer.get({ path: API_ROOT+'browsers/:browserId', name: 'getBrowser' }, function(req, res){
	var browserId = req.params.browserId;
	var browser = browsers.get(browserId);
	res.send(browser.toJSON());
});

apiServer.patch({ path: API_ROOT+'browsers/:browserId', name: 'patchBrowser' }, function(req, res){
	var browserId = req.params.browserId;
	var browser = browsers.get(browserId);
	browser.set(_.pick(req.body, ["name", "isFullscreen", "isCyclePaused", "cycleTabDuration"]));
	res.send(200);
});

apiServer.get({ path: API_ROOT+'browsers/:browserId/screenshot.png', name: 'getScreenshot' }, function(req, res){
	var browserId = req.params.browserId;
	var screenshot = screenshots[browserId];
	if(screenshot){
		res.header('Content-Type', 'image/png');
		res.end(screenshot, 'base64');
	} else {
		res.send(404, "No screenshot for "+browserId);
	}
});


browserSockets.on('connection', function(socket){
	var browserConnection = new BrowserConnection(socket);
	browserConnection.once('change:id', function(browserId){
		var browser = browsers.get(browserId);

		if(!browser){
			browser = new Browser({ id: browserId });
			browsers.add(browser);
		}

		browserConnection.bindBrowser(browser);

		socket.on("screenshot", function(dataUri){
			var stripped = dataUri.replace(/^data:image\/png;base64,/, '');
			var decoded = new Buffer(stripped, 'base64');
			screenshots[browser.id] = decoded;
			console.log("received screenshot from "+browser.id+" (length = "+dataUri.length+")");
			adminSockets.emit("change:screenshot", browser.id);
		});
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