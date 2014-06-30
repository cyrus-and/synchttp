var Future = require('fibers/future');
var http = require('http');
var URL = require('url');

// TODO check HTTP status
// TODO more HTTP methods
// TODO non only JSON

function wrap(funct) {
    return function () {
        return funct.apply(null, arguments).wait();
    };
}

module.exports.get = wrap(function (url) {
    var future = new Future();
    http.get(url, function(res) {
        res.on('readable', function () {
            var body = res.read().toString();
            var message = JSON.parse(body);
            future.return(message);
        });
    }).on('error', function(err) {
        future.return(err);
    });
    return future;
});

module.exports.post = wrap(function (url, object) {
    var future = new Future();
    var options = URL.parse(url);
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/json'
    };
    var req = http.request(options, function(res) {
        res.on('readable', function () {
            var body = res.read().toString();
            var message = JSON.parse(body);
            future.return(message);
        });
    });
    req.on('error', function(err) {
        future.return(err);
    });
    req.end(JSON.stringify(object, null, 4));
    return future;
});
