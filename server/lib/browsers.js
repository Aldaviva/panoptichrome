var Backbone          = require('backbone');
var Browser           = require('./Browser');

var browsers = module.exports = new Backbone.Collection([], { model: Browser });