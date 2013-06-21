(function(){
	

	//TODO when the current model is removed from the collection, we should focus a different browser

	window.DetailView = Backbone.View.extend({

		className: 'DetailView',

		events: {
			"blur .name"                 : "onNameBlur",
			"keyup .name"                : "onNameKeyUp",
			"click .cycle button"        : 'onClickCycleButton',
			"click .fullscreen button"   : 'onClickFullscreenButton',
			"click .cycle .durationLink" : 'onClickCycleDurationLink'
		},

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
						.append($('<div>', { class: 'title' })
							.append($('<input>', { class: 'name', attr: { type: 'text' }}))
							.append($('<div>', { class: 'address' })));

					var tabListView = new TabListView({ collection: this.model.tabs });

					this.$el.append($('<div>', { class: 'buttons' })
						.append($('<div>', { class: 'cycle' })
							.append($('<button>'))
							.append($('<span>', { class: 'label' })
								.append($('<span>', {
									class: 'pausedLabel',
									html: '<strong>Paused</strong> on one tab' }))
								.append($('<span>', {
									class: 'unpausedLabel',
									html: '<strong>Cycling</strong> '})
									.append($('<a>', {
										class: 'durationLink',
										attr: { href: '#' }}))
									.append($('<span>', { text: ' per tab' })))))
						.append($('<div>', { class: 'fullscreen' })
							.append($('<button>'))
							.append($('<span>', { class: 'label' })
								.append($('<span>', {
									class: 'fullscreenEnabled',
									html: '<strong>Fullscreen</strong> enabled' }))
								.append($('<span>', {
									class: 'fullscreenDisabled',
									html: '<strong>Fullscreen</strong> disabled'
								})))));

					this.$el.append(tabListView.render());
				}

				this.renderTitle();
				this.renderCycleButton();
				this.renderFullscreenButton();
			}

			return this.el;
		},

		renderTitle: function(){
			var title = this.$('.title');
			$('.name', title).val(this.model.get('name'));
			$('.address', title).text(this.model.get('address'));
		},

		setModel: function(model){
			this.stopListening(this.model);
			this.model = model;

			this.connectEvents();
		},

		connectEvents: function(){
			this.listenTo(this.model, 'change:tabs', _.bind(function(){
				this.render();
			}, this));

			this.listenTo(this.model, 'change:isFullscreen', this.renderFullscreenButton);

			this.listenTo(this.model, 'change:isCyclePaused change:cycleTabDuration', this.renderCycleButton);
		},

		renderCycleButton: function(){
			var cycleDiv = this.$('.buttons .cycle');
			var isCyclePaused = this.model.get('isCyclePaused');

			cycleDiv.toggleClass('paused', isCyclePaused);
			var durationLink = $('.durationLink', cycleDiv);
			durationLink.text(this.getCycleDuration() + ' sec');
		},

		renderFullscreenButton: function(){
			var fullScreenDiv = this.$('.buttons .fullscreen');

			var isFullscreen = this.model.get('isFullscreen');
			fullScreenDiv.toggleClass('enabled', isFullscreen);
		},

		onNameBlur: function(event){
			var newName = $(event.currentTarget).val();
			this.model.save({ name: newName }, { patch: true });
		},

		onNameKeyUp: function(event){
			if(event.keyCode == 13){ //enter
				event.preventDefault();
				$(event.currentTarget).blur();
			}
		},

		onClickCycleButton: function(event){
			var wasCyclePaused = this.model.get('isCyclePaused');
			this.model.save({ isCyclePaused: !wasCyclePaused }, { patch: true });
		},

		onClickFullscreenButton: function(event){
			var wasFullscreen = this.model.get('isFullscreen');
			this.model.save({ isFullscreen: !wasFullscreen }, { patch: true});
		},

		getCycleDuration: function(){
			return Math.round(this.model.get('cycleTabDuration')/1000);
		},

		onClickCycleDurationLink: function(event){
			event.preventDefault();

			var newDurationSeconds = parseInt(prompt("How long should each tab be shown? (seconds)", this.getCycleDuration()), 10);
			if(newDurationSeconds > 0){
				var newDurationMillis = newDurationSeconds * 1000;
				this.model.save({ cycleTabDuration: newDurationMillis }, { patch: true });
			}
		}

	});

})();