var _            = require('lodash');
var EventEmitter = require('events').EventEmitter;
var my           = require('myclass');

var BrowserConnection = module.exports = my.Class(null, EventEmitter, {

	constructor: function(socket){
		_.bindAll(this);

		this.socket           = socket;
		this.address          = null;
		this.browser          = null;
		this.cycleTabInterval = null;

		socket.on('disconnect',         this.destroy);
		socket.on('online',             this.onOnline);
		socket.on('tabs:list',          this.onTabsList);
		socket.on('fullscreen:changed', this.onFullscreenChange);
		socket.on('screenSize',         this.onScreenSize);
	},

	destroy: function(){
		if(this.browser){
			this.browser.trigger('connection:destroy');
			// this.browser.collection && this.browser.collection.remove(this.browser);
		}

		this.cycleTabInterval && clearInterval(this.cycleTabInterval);
		this.cycleTabInterval = null;
	},

	onOnline: function(opts){
		this._clientOpts = opts;
		this.address = this.socket.handshake.address.address;
		console.info("Client online from %s (id=%s).", this.address, opts.id);

		this.emit('change:id', this.id);
	},

	bindBrowser: function(browser){
		this.browser = browser;
		browser.connection = this;
		browser.tabs.reset(this._clientOpts.tabs);
		browser.set(_.extend({ address: this.address }, _.omit(this._clientOpts, 'tabs')));
		delete this._clientOpts;

		//these might get weird if the client reconnects and double-registers these callbacks. maybe we should use Events.listenTo() and Events.stopListening() instead.

		browser.on("change:isFullscreen", _.bind(function(model, val, opts){
			!opts.fromClient && this.setFullscreen(val);
		}, this));

		browser.on("change:name", _.bind(function(model, val){
			this.setName(val);
		}, this));

		browser.on("change:isFullscreen", _.bind(function(model, val){
			this.setFullscreen(val);
		}, this));

		browser.on("change:isCyclePaused", _.bind(function(model, val){
			this.setCyclePaused(val);
		}, this));

		browser.on("change:cycleTabDuration", _.bind(function(model, val){
			this.setCycleTabDuration(val);
		}, this));

		browser.tabs.on("remove", _.bind(function(model){
			this.removeTab(model.id);
		}, this));

		browser.tabs.on("add", _.bind(function(model, coll){
			/*
			 * Tab model doesn't have an ID yet, so we won't be able to merge it later when chrome assigns an ID.
			 * Instead, just delete it and let chrome add it for real later.
			 */
			coll.remove(model, { silent: true }); 
			this.addTab(model.get('url'));
		}, this));

		browser.tabs.on('reload', _.bind(function(model){
			this.reloadTab(model.id);
		}, this));
	},

	onTabsList: function(tabs){
		this.browser.tabs.reset(tabs);
	},

	addTab: function(url){
		this.socket.emit('tabs:add', url);
	},

	activateTab: function(tab){
		this.socket.emit('tabs:activate', tab.id);
	},

	setFullscreen: function(shouldBeFullscreen){
		this.socket.emit('fullscreen:set', shouldBeFullscreen);
	},

	onFullscreenChange: function(isFullscreen){
		this.browser.set({ isFullscreen: isFullscreen }, { fromClient: true });
	},

	onScreenSize: function(screenSize){
		this.browser.set({ screenSize: screenSize });
	},

	setName: function(name){
		this.socket.emit('name:set', name);
	},

	setCyclePaused: function(isPaused){
		this.socket.emit("cycle:ispaused:set", isPaused);
	},

	setCycleTabDuration: function(durationMillis){
		this.socket.emit("cycle:tabduration:set", durationMillis);
	},

	removeTab: function(tabId){
		this.socket.emit("tabs:remove", tabId);
	},

	reloadTab: function(tabId){
		this.socket.emit("tabs:reload", tabId);
	}
});