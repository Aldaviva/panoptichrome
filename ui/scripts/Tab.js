(function(){

	window.Tab = Backbone.Model.extend({

	});

	window.TabList = Backbone.Collection.extend({
		initialize: function(browser){
			this.browser = browser;
		},
		model: Tab,
		comparator: "index",
		url: function(){
			return this.browser.url()+'/tabs/';
		}
	});

})();