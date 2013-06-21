(function(){

	window.mediator = new Mediator();

	window.browsers = new Backbone.Collection([], {
		model: window.Browser,
		url: 'cgi-bin/browsers'
	});

	connectAndListenOnSockets();
	render();
	browsers.fetch(function(){
		browsers.each(function(browser){
			browser.tabs.fetch();
		});
	});

	browsers.once('add', function(model){
		mediator.publish('browserListItem:focus', model);
	});

	function connectAndListenOnSockets(){
		var socketUrl = location.protocol+'//'+location.host+'/admins';
		var socket = io.connect(socketUrl);

		socket.on('connect', function(){});

		socket.on('change:browser', function(modelAttributes){
			var model = browsers.get(modelAttributes.id);
			model.set(model.parse(modelAttributes));
		});

		socket.on('add:browser', function(modelAttributes){
			browsers.add(modelAttributes, { parse: true });
		});

		socket.on('remove:browser', function(modelId){
			browsers.remove(modelId);
		});

		socket.on('change:screenshot', function(browserId){
			var browser = browsers.get(browserId);
			mediator.publish('change:screenshot:'+browserId, browser);
		});
	}

	function render(){
		var browserListView = new BrowserListView({ collection: browsers });
		$('#panoptichrome').append(browserListView.render());

		var detailView = new DetailView();
		$('#panoptichrome').append(detailView.render());	
	}

})();