var Fiber = require('fibers');
var Synchttp = require('./lib/synchttp.js');

// run the supplied code within a fiber
module.exports = function (instructions) {
    Fiber(function () {
        var synchttp = new Synchttp();
        instructions(synchttp);
        synchttp.wsCloseAll();
    }).run();
};
