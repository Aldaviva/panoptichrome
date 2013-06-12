(function(){
	
	window.TabsView = Backbone.View.extend({
		className: 'tags',

		initialize: function(){
			_.bindAll(this);

			this.collection.on('add', _.bind(function(model){
				var tabView = new TabView({ model: model });
				model.views = model.views || {};
				model.views.tabView = tabView;
				this.$el.append(tabView.render());
			}, this));

			mediator.subscribe('browser:focus', function(){
				this.$('.focused').removeClass('.focused');
			})
		},

		render: function(){
			if(!this.el.childElementCount){

			}

			return this.el;
		}
	});

	window.TabView = Backbone.View.extend({
		className: 'tab',

		events: {
			"click": 'onClick'
		},

		initialize: function(){
			_.bindAll(this);

			this.model.on('change', this.render);
		},

		render: function(){
			if(!this.el.childElementCount){
				this.$el
					.append($('<div>').addClass('icon'))
					.append($('<div>').addClass('screenshot'))
					.append($('<div>').addClass('name'));
			}

			this.$('.name').text(this.model.get('address'));

			return this.el;
		},

		onClick: function(){
			mediator.publish("browser:focus", this.model);
			this.addClass('focused'); //i hope publishing is synchronous, otherwise we need to track more state
		}
	});

})();