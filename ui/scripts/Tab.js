(function(){

	window.Tab = Backbone.Model.extend({
		
		reload: function(){
			$.ajax(this.url() + '/reload', {
				type: 'PUT'
			});
		}
	});

	window.TabList = Backbone.Collection.extend({

		model: Tab,

		comparator: "index",

		initialize: function(models, options){
			this.browser = options.browser;
		},
		
		url: function(){
			return this.browser.url()+'/tabs/';
		}
	});

})();