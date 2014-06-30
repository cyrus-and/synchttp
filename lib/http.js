var Future = require('fibers/future');
var http = require('http');
var URL = require('url');

function wrap(funct) {
    return function () {
        return funct.apply(null, arguments).wait();
    };
}

module.exports.get = wrap(function (url) {
    var future = new Future();
    var request = http.get(url, function (response) {
        response.on('readable', function () {
            var body = response.read().toString();
            var message = JSON.parse(body);
            future.return(message);
        });
    });
    request.on('error', function (err) {
        future.return(err);
    });
    return future;
});

module.exports.post = wrap(function (url, message) {
    var future = new Future();
    var options = URL.parse(url);
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/json'
    };
    var request = http.request(options, function (response) {
        response.on('readable', function () {
            var body = response.read().toString();
            var message = JSON.parse(body);
            future.return(message);
        });
    });
    request.on('error', function (err) {
        future.return(err);
    });
    request.end(JSON.stringify(message, null, 4));
    return future;
});
