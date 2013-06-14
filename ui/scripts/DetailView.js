(function(){
	

	//TODO when the current model is removed from the collection, we should focus a different browser

	window.DetailView = Backbone.View.extend({

		initialize: function(){
			_.bindAll(this);

			mediator.subscribe("browserListItem:focus", _.bind(function(browser){
				this.setModel(browser);
				this.render(true);
			}, this));
		},

		render: function(isReplace){
			if(this.model){
				if(!this.el.childElementCount || isReplace){
					this.$el
						.empty()
						.append($('<div>').addClass('title')
							.append($('<h1>').addClass('name'))
							.append($('<h2>').addClass('address')));

					var tabListView = new TabListView({ collection: this.model.get('tabs') });
					this.$el.append(tabListView.render());

					this.$el.append($('<div>').addClass('buttons'));
				}

				this.renderTitle();
				this.renderButtons();
			}

			return this.el;
		},

		renderTitle: function(){
			var title = this.$('.title');
			$('h1', title).text(this.model.get('name'));
			$('.address', title).text(this.model.get('address'));
		},

		setModel: function(model){
			this.stopListening(this.model);
			this.model = model;

			this.listenTo(model, 'change', _.bind(function(){
				this.render();
			}, this));
		},

		renderButtons: function(){
			this.$('.buttons').text('buttons go here');
		}

	});

})();