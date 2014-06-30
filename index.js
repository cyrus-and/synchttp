var Fiber = require('fibers');
var http = require('./lib/http.js');

// run the supplied code within a fiber
module.exports = function (instructions) {
    Fiber(function () {
        instructions(http);
    }).run();
};
