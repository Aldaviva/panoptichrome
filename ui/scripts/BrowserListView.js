(function(){
	
	window.BrowserListView = Backbone.View.extend({
		className: 'BrowserListView',

		initialize: function(){
			_.bindAll(this);

			this.collection
				.on('add', _.bind(function(model){
					var browserListItemView = new BrowserListItemView({ model: model });
					model.views = model.views || {};
					model.views.browserListItemView = browserListItemView;
					this.$el.append(browserListItemView.render());

					if(this.collection.length === 1){
						browserListItemView.focus();
					}
				}, this))
				.on('remove', _.bind(function(model){
					var view = model.views.browserListItemView;

					if(model.views.browserListItemView.$el.hasClass('focused')){
						var anotherModel = model.collection.find(function(m){
							m.id !== model.id;
						});
						anotherModel && anotherModel.views.browserListItemView.focus();
					}
					view.remove();
				}));
		},

		render: function(){
			if(!this.el.childElementCount){
				this.$el.append($('<a>', { href: 'http://skadi.bluejeansnet.com/panoptichrome/panoptichrome.crx', class: 'addBrowserLink BrowserListItemView' })
					.append($('<div>', { class: 'icon', text: '+' }))
					.append($('<div>', { class: 'name', text: 'add'})));
			}

			return this.el;
		}
	});

	var BrowserListItemView = Backbone.View.extend({
		className: 'BrowserListItemView',

		events: {
			"click": 'focus'
		},

		initialize: function(){
			_.bindAll(this);

			this.model.on('change', this.render);
			mediator.subscribe('change:screenshot:'+this.model.id, this.renderScreenshot);
			mediator.subscribe('browserListItem:focus', this.onSomeTabFocus);
		},

		render: function(){
			if(!this.el.childElementCount){
				this.$el
					.append($('<div>', { class: 'icon browser_'+this.model.id })
						.append($('<img>').addClass('screenshot')))
					.append($('<div>', { class: 'name' }));
			}

			this.$('.name').text(this.model.get('name'));
			this.renderScreenshot();

			return this.el;
		},

		renderScreenshot: function(){
			var img = this.$('.screenshot');
			img.attr('src', this.model.generateScreenshotUrl());
		},

		focus: function(){
			mediator.publish("browserListItem:focus", this.model);
			 //i hope publishing is synchronous, otherwise we need to track more state
		},

		onSomeTabFocus: function(model){
			this.$el.toggleClass('focused', model.id === this.model.id);
		}
	});

})();
