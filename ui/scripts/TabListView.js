(function(){

	window.TabListView = Backbone.View.extend({

		className: 'tabs TabListView',

		initialize: function(){
			_.bindAll(this);

			this.collection.on('add',    this.addTab);
			this.collection.on('remove', this.removeTab); //maybe destroy instead
		},

		render: function(){
			if(!this.el.childElementCount){
				this.collection.each(this.addTab, this);

				var logEventName = function(event, ui){
					console.log(event.type);
				};

				this.$el.sortable({
					axis        : "y",
					cursor      : "move",
					handle      : ".dragHandle",
					containment : "parent",
					tolerance   : "pointer",
					stop        : _.bind(function(event, ui){
						this.onDrag(ui.item, ui.item.index());
					}, this)
				});

				this.collection.on('add remove', this.updateDrag);
			}

			return this.el;
		},

		onDrag: function(item, newIndex){
			var tabView = item.data('view');
			var tabModel = tabView.model;
			console.log("dragged "+tabModel.get('url') + ' to position '+newIndex);
		},

		updateDrag: function(){
			if(this.el.childElementCount){
				this.$el.sortable("refresh");
			}
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

		className: 'tab TabView',

		// events: {
		// 	"click .reload": "onClickReload",
		// 	"click .close": "onClickClose"
		// },

		initialize: function(){
			_.bindAll(this);
			this.$el.data('view', this);

			this.model.on('change', this.render);
			this.model.on('change:index', this.reorder);
		},

		render: function(){
			if(!this.el.childElementCount){
				this.$el
					.append($('<div>', {
						class: 'dragHandle',
						attr: { title: 'Drag to rearrange tabs' }}))
					.append($('<img>', { class: 'favicon' }))
					.append($('<input>', {
						class: 'url',
						attr: { type: 'text' }}))
					.append($('<span>', { class: 'title' }))
					.append($('<button>', {
						class: 'close',
						text: 'x',
						attr: { title: 'Close tab' }}))
					.append($('<button>', {
						class: 'reload',
						text: 'r',
						attr: { title: 'Reload tab' }}));
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
			var parent = this.$el.parent();
			if(index === 0){
				this.$el.appendTo(parent);
			} else {
				var previousEl = parent.children().eq(index - 1);
				this.$el.insertAfter(previousEl);
				// var previousModel = this.model.collection.where({ index: index - 1 })[0];
				// this.$el.insertAfter(previousModel.views.tabView.$el);
			}
		},

		onClickReload: function(){
			this.model.reload();
		},

		onClickClose: function(){
			this.model.destroy();
		}
	});

})();