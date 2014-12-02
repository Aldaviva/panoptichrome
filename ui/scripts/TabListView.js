(function(){

	window.TabListView = Backbone.View.extend({

		className: 'tabs TabListView',

		initialize: function(){
			_.bindAll(this);

			this.sortable = null;

			this.collection.on('add',    this.addTab);
			this.collection.on('remove', this.removeTab); //maybe destroy instead
		},

		render: function(){
			if(!this.el.childElementCount){
				this.$el.append(new TabInserterView({ collection: this.collection }).render());
				this.sortable = $('<div>', { class: 'sortable' });

				this.$el.append(this.sortable);
				this.collection.each(this.addTab, this);

				this.sortable.sortable({
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
			tabModel.save({ index: newIndex }, { patch: true });
			// console.log("dragged "+tabModel.get('url') + ' to position '+newIndex);
		},

		updateDrag: function(){
			// this.sortable && this.sortable[0].childElementCount && this.sortable.sortable("refresh");
		},

		addTab: function(tabModel){
			var tabView = new TabView({ model: tabModel });
			tabModel.views = tabModel.views || {};
			tabModel.views.tabView = tabView;
			this.sortable.append(tabView.render());
			this.updateDrag();
		},

		removeTab: function(tabModel){
			tabModel.views.tabView.remove();
			this.updateDrag();
		}
	});

	var TabView = Backbone.View.extend({

		className: 'tab TabView',

		events: {
			"click .reload": "onClickReload",
			"click .close": "onClickClose",
			"keyup .url": "onKeyUpUrl",
			"click .url": "onClickUrl",
			"blur .url": "onBlurUrl",
			// "click .favicon": "activate",
			// "click .title": "activate"
			"click": "activate"
		},

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
						attr: { title: 'Close tab' }}))
					.append($('<button>', {
						class: 'reload',
						attr: { title: 'Reload tab' }}));
			}

			var favIconUrl = this.model.get('favIconUrl');
			if(!/^http/.test(favIconUrl)){
				favIconUrl = 'images/defaultFavicon.png';
			}
			this.$('.favicon').attr('src', favIconUrl);
			this.$('.url').val(this.model.get('url').replace(/\/$/, ''));
			this.$('.title')
				.text(this.model.get('title'))
				.attr('title', this.model.get('title'));
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

		onClickClose: function(event){
			event.stopPropagation();
			this.model.destroy();
		},

		onKeyUpUrl: function(event){
			if(event.keyCode == 13){ //enter
				event.preventDefault();
				var currentTarget = $(event.currentTarget);
				currentTarget.blur();
				this.model.save({ url: currentTarget.val() }, { patch: true });
			}
		},

		onClickUrl: function(event){
			event.preventDefault();
			event.stopPropagation();
			var currentTarget = $(event.currentTarget);
			_.defer(function(){
				currentTarget.select();
			});
		},

		onBlurUrl: function(event){
			this.selectionStart = 0;
			this.selectionEnd = 0;
		},

		activate: function(event){
			event.preventDefault();
			this.model.save({ active: true }, { patch: true });
		}
	});

	var TabInserterView = Backbone.View.extend({

		className: 'TabInserterView TabView',

		events: {
			"keyup .url": 'onKeyUpUrl'
		},

		initialize: function(){
			_.bindAll(this);
		},

		render: function(){
			if(!this.el.childElementCount){
				this.$el
					.append($('<img>', {
						class: 'favicon',
						attr: {
							src: 'images/tab-add-plus.png'
						}
					}))
					.append($('<div>', { class: 'urlWidth' })
						.append($('<input>', {
							class: 'url',
							attr: {
								type: 'text',
								placeholder: 'add tab'
							}})));
			}

			return this.el;
		},

		onKeyUpUrl: function(event){
			if(event.keyCode == 13){ //enter
				event.preventDefault();
				var currentTarget = $(event.currentTarget);
				currentTarget.blur();

				this.collection.create({ url: currentTarget.val() });
			}
		}

	});

})();
