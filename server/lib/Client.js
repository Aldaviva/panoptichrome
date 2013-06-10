var _  = require('lodash');
var my = require('myclass');

var Client = my.Class({

	constructor: function(socket){
		_.bindAll(this);
		this.socket = socket;
		this.tabs = [];
		this.cycleTabInterval = null;
		this.isFullscreen = null;
		this.screenSize = null;

		socket.on('disconnect',         this.destroy);
		socket.on('online',             this.onOnline);
		socket.on('tabs:list',          this.onTabsList);
		socket.on('fullscreen:changed', this.onFullscreenChange);
		socket.on('screenSize',         this.onScreenSize);
	},

	destroy: function(){
		//TODO emit events to remove from collections, tell UI to remove from views?
		this.cycleTabInterval && clearInterval(this.cycleTabInterval);
		this.cycleTabInterval = null;
	},

	onOnline: function(opts){
		_.extend(this, opts);
		console.info("Client online from %s (id=%s)", this.socket.handshake.address.address, this.id);
	},

	onTabsList: function(tabs){
		this.tabs = tabs;
	},

	addTab: function(url){
		this.socket.emit('tabs:add', url);
	},

	activateTab: function(tab){
		this.socket.emit('tabs:activate', tab.id);
	},

	activateNextTab: function(){
		var currentActiveTab = _.find(this.tabs, 'active');
		var currentActiveTabIndex = currentActiveTab ? currentActiveTab.index : -1;
		var nextActiveTabIndex = (currentActiveTabIndex + 1) % this.tabs.length;
		var nextActiveTab = _.find(this.tabs, { index: nextActiveTabIndex });

		this.activateTab(nextActiveTab);
	},

	setFullscreen: function(shouldBeFullscreen){
		this.socket.emit('fullscreen:set', shouldBeFullscreen);
	},

	onFullscreenChange: function(isFullscreen){
		this.isFullscreen = isFullscreen;
		console.info("Client " + (isFullscreen ? "entered" : "left") + " fullscreen.");
	},

	onScreenSize: function(screenSize){
		this.screenSize = screenSize;
		console.info("Client has a %d × %d display.", screenSize.width, screenSize.height);
	}
});

module.exports = Client;