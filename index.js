var Fiber = require('fibers');
var http = require('./lib/http.js');

module.exports = function (instructions) {
    Fiber(function() {
        instructions(http);
    }).run();
};
