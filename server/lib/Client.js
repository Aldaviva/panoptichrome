var _  = require('lodash');
var my = require('myclass');

var Client = my.Class({

	constructor: function(socket){
		_.bindAll(this);
		this.socket = socket;

		socket.on('disconnect', this.destroy);
		socket.on('online',     this.onOnline);
		socket.on('tabs:list',  this.onTabsList);
	},

	destroy: function(){
		//TODO remove from collections, tell UI to remove from views?
	},

	onOnline: function(opts){
		_.extend(this, opts);
		console.info("Client online: %s", this.id);
	},

	onTabsList: function(tabs){
		this.tabs = tabs;
		console.log("%s tabs", this.id, tabs);
	},

	addTab: function(url){
		this.socket.emit('tabs:add', url);
	}
});

module.exports = Client;