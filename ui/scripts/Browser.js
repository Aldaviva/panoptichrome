(function(){

	window.Browser = Backbone.Model.extend({
		initialize: function(){
			// _.bindAll(this, '_updateTabs');
			this.tabs = new TabList(this);

			// this.set('tabs', new TabList());
			// this._updateTabs();
			// this.on('change:rawTabs', this._updateTabs);
		},

		/*
		 * Maintain a transient property to hold a collection of tabs.
		 */
		/*_updateTabs: function(){
			var newVal = this.get('rawTabs');
			var tabsCollection = this.get('tabs');
			tabsCollection.set(newVal);
		},*/

		generateScreenshotUrl: function(){
			return 'cgi-bin/browsers/'+this.id+'/screenshot.png?'+(+new Date());
		},

		/*
		 * Rename tabs to rawTabs so we can assign a Collection to tabs.
		 */
		parse: function(rawAttrs){
			/*if(rawAttrs.tabs){
				rawAttrs.rawTabs = rawAttrs.tabs;
				delete rawAttrs.tabs;
			}*/
			return rawAttrs;
		},

		fetch: function(){
			Backbone.Model.prototype.fetch.apply(null, arguments);
			this.tabs.fetch();
		}
	});

})();