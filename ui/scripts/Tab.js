(function(){

	window.Tab = Backbone.Model.extend({

	});

	window.TabList = Backbone.Collection.extend({
		model: Tab,
		comparator: "index"
	});

})();