(function(){

	window.TabListView = Backbone.View.extend({

		className: 'tabs',

		initialize: function(){
			_.bindAll(this);

			this.collection.on('add', this.addTab);
			this.collection.on('remove', this.removeTab);
		},

		render: function(){
			if(!this.el.childElementCount){
				this.collection.each(this.addTab, this);
			}

			return this.el;
		},

		addTab: function(tabModel){
			var tabView = new TabView({ model: tabModel });
			tabModel.views = tabModel.views || {};
			tabModel.views.tabView = tabView;
			this.$el.append(tabView.render());
		},

		removeTab: function(tabModel){
			tabModel.views.tabView.remove();
		}
	});

	var TabView = Backbone.View.extend({

		className: 'tab',

		initialize: function(){
			_.bindAll(this);

			this.model.on('change', this.render);
			this.model.on('change:index', this.reorder);
		},

		render: function(){
			if(!this.el.childElementCount){
				this.$el
					.append($('<img>').addClass('favicon'))
					.append($('<input>')
						.addClass('url')
						.attr({ type: 'text' }))
					.append($('<span>').addClass('title'));
			}

			var favIconUrl = this.model.get('favIconUrl');
			if(!/^http/.test(favIconUrl)){
				favIconUrl = 'images/defaultFavicon.png';
			}
			this.$('.favicon').attr('src', favIconUrl);
			this.$('.url').val(this.model.get('url'));
			this.$('.title').text(this.model.get('title'));
			this.$el.toggleClass('active', this.model.get('active'));

			return this.el;
		},

		reorder: function(){
			var index = this.model.get('index');
			if(index === 0){
				this.$el.appendTo(this.$el.parent());
			} else {
				var previousModel = this.model.collection.where({ index: index - 1 })[0];
				this.$el.insertAfter(previousModel.views.tabView.$el);
			}

		}
	});

})();