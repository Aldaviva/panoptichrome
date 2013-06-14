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
			this.browser.collection && this.browser.collection.remove(this.browser);
		}

		this.cycleTabInterval && clearInterval(this.cycleTabInterval);
		this.cycleTabInterval = null;
	},

	onOnline: function(opts){
		this.clientOpts = opts;
		this.address = this.socket.handshake.address.address;
		console.info("Client online from %s (id=%s).", this.address, opts.id);

		this.emit('change:id', this.id);
	},

	bindBrowser: function(browser){
		this.browser = browser;
		browser.connection = this;
		browser.set(_.extend({ address: this.address }, this.clientOpts));
	},

	onTabsList: function(tabs){
		this.browser.set({ tabs: tabs });
	},

	addTab: function(url){
		this.socket.emit('tabs:add', url);
	},

	activateTab: function(tab){
		this.socket.emit('tabs:activate', tab.id);
	},

	activateNextTab: function(){
		var tabs = this.browser.get('tabs');

		var currentActiveTab = _.find(tabs, 'active');
		var currentActiveTabIndex = currentActiveTab ? currentActiveTab.index : -1;
		var nextActiveTabIndex = (currentActiveTabIndex + 1) % tabs.length;
		var nextActiveTab = _.find(tabs, { index: nextActiveTabIndex });

		this.activateTab(nextActiveTab);
	},

	setFullscreen: function(shouldBeFullscreen){
		this.socket.emit('fullscreen:set', shouldBeFullscreen);
	},

	onFullscreenChange: function(isFullscreen){
		this.browser.set({ isFullscreen: isFullscreen });
	},

	onScreenSize: function(screenSize){
		this.browser.set({ screenSize: screenSize });
	}
});