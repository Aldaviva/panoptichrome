/*(function(){

	var Backbone = this.Backbone || require('backbone');

	var Browser = Backbone.Model.extend({

	});

	if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
		define(function(){
			return Browser;
		});
	} else if(typeof module != 'undefined'){
		module.exports = Browser;
	} else {
		window.Browser = Browser;
	}

})();*/

var _ = require('lodash');
var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
	initialize: function(){
		this.tabs = new TabList(null, { browser: this });
	}
});

var Tab = Backbone.Model.extend({});

var TabList = Backbone.Collection.extend({
	initialize: function(models, options){
		this.browser = options.browser;
	},
	model: Tab,
	comparator: "index"
});