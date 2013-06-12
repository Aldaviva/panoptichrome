(function(){

	window.mediator = new Mediator();

	window.browsers = new Backbone.Collection([], {
		model: window.Browser,
		url: 'cgi-bin/browsers'
	});

	var socket = io.connect('http://10.4.4.251:8081/admins');

	socket.on('connect', function(){});

	socket.on('change:browser', function(modelAttributes){
		browsers.get(modelAttributes.id).set(modelAttributes);
	});

	socket.on('add:browser', function(modelAttributes){
		browsers.add(modelAttributes);
	});

	var tabsView = new TabsView({ collection: browsers });
	$('#panoptichrome').append(tabsView.render());

	browsers.fetch();

})();