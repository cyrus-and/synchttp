var Fiber = require('fibers');
var Synchttp = require('./lib/synchttp.js');

// run the supplied code within a fiber
module.exports = function (instructions) {
    Fiber(function () {
        var synchttp = new Synchttp();
        var delegate = {};
        // copy parameters
        for (var parameter in synchttp.setters) {
            delegate[parameter] = synchttp.setters[parameter];
        }
        // copy methods
        delegate.get = synchttp.httpGet;
        delegate.post = synchttp.httpPost;
        delegate.put = synchttp.httpPut;
        delegate.delete = synchttp.httpDelete;
        delegate.ws = synchttp.wsConnect;
        delegate.send = synchttp.wsSend;
        delegate.receive = synchttp.wsReceive;
        // run cliend code
        instructions(delegate);
        // terminate all the WebSockets
        synchttp.wsCloseAll();
    }).run();
};
