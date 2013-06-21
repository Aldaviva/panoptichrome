var _                 = require('lodash');
var apiServer         = require('./apiServer');
var Browser           = require('./Browser');
var BrowserConnection = require('./BrowserConnection');
var browsers          = require('./browsers');
var util              = require('util');

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

apiServer.get({ path: API_ROOT+'browsers/:browserId/tabs', name: 'getTabs' }, function(req, res){
	var browserId = req.params.browserId;
	var browser = browsers.get(browserId);
	if(browser){
		res.send(browser.tabs.toJSON());
	} else {
		res.send(404, "No browsers found with id = "+browserId);
	}
});

apiServer.post({ path: API_ROOT+'browsers/:browserId/tabs', name: 'addTab' }, function(req, res){
	var browserId = req.params.browserId;
	var browser = browsers.get(browserId);

	if(browser){
		var tabAttributes = { url: req.body.url };
		browser.tabs.add(tabAttributes);
		res.send(200);
	} else {
		res.send(404, "No browsers found with id = "+browserId);
	}
});

apiServer.get({ path: API_ROOT+'browsers/:browserId/tabs/:tabId', name: 'getTab' }, function(req, res){
	var browserId = req.params.browserId;
	var tabId = req.params.tabId;
	var browser = browsers.get(browserId);
	if(browser){
		var tab = browser.tabs.get(tabId);
		if(tab){
			res.send(tab.toJSON());
		} else {
			res.send(404, "Browser does not have a tab with id = " + tabId);
		}
	} else {
		res.send(404, "No browsers found with id = "+browserId);
	}
});

apiServer.del({ path: API_ROOT+'browsers/:browserId/tabs/:tabId', name: 'removeTab' }, function(req, res){
	var browserId = req.params.browserId;
	var tabId = req.params.tabId;

	var browser = browsers.get(browserId);
	if(browser){
		browser.tabs.remove(tabId);
		res.send(200);
	} else {
		res.send(404, "No browsers found with id = "+browserId);
	}
});

apiServer.put({ path: API_ROOT+'browsers/:browserId/tabs/:tabId/reload', name: 'reloadTab' }, function(req, res){
	try {
		var browserId = req.params.browserId;
		var tabId = req.params.tabId;

		var browser = browsers.get(browserId);
		if(browser){
			var tab = browser.tabs.get(tabId);
			if(tab){
				tab.trigger('reload', tab, browser.tabs, {});
				res.send(204);
			} else {
				res.send(404, "Browser does not have a tab with id = " + tabId);
			}
		} else {
			res.send(404, "No browsers found with id = "+browserId);
		}
	} catch (e){
		console.error("error in handler", util.inspect(e, { showHidden: true }));
		console.error(e.stack);
	}
});

apiServer.get({ path: API_ROOT+'browsers/:browserId/screenshot.jpg', name: 'getScreenshot' }, function(req, res){
	var browserId = req.params.browserId;
	var screenshot = screenshots[browserId];
	if(screenshot){
		res.header('Content-Type', 'image/jpeg');
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
			var stripped = dataUri.replace(/^data:image\/jpeg;base64,/, '');
			var decoded = new Buffer(stripped, 'base64');
			screenshots[browser.id] = decoded;
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