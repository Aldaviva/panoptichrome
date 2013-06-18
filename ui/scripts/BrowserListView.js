(function(){
	
	window.BrowserListView = Backbone.View.extend({
		className: 'browserList',

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

			mediator.subscribe('browserListItem:focus', _.bind(function(){
				this.$('.focused').removeClass('.focused');
			}, this));
		},

		render: function(){
			if(!this.el.childElementCount){

			}

			return this.el;
		}
	});

	var BrowserListItemView = Backbone.View.extend({
		className: 'browserListItem',

		events: {
			"click": 'focus'
		},

		initialize: function(){
			_.bindAll(this);

			this.model.on('change', this.render);
			mediator.subscribe('change:screenshot:'+this.model.id, this.renderScreenshot);
		},

		render: function(){
			if(!this.el.childElementCount){
				this.$el
					.append($('<div>').addClass('icon'))
					.append($('<img>').addClass('screenshot'))
					.append($('<div>').addClass('name'));
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
			this.$el.addClass('focused'); //i hope publishing is synchronous, otherwise we need to track more state
		}
	});

})();