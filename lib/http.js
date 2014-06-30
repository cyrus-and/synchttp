var Future = require('fibers/future');
var http = require('http');
var URL = require('url');

function wrap(funct) {
    return function () {
        return funct.apply(null, arguments).wait();
    };
}

function request(method, url, object) {
    var future = new Future();
    var options = URL.parse(url);
    options.method = method;
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
    if (typeof object === 'object') {
        request.end(JSON.stringify(object, null, 4));
    } else {
        request.end();
    }
    return future;
}

module.exports.get = wrap(function (url) {
    return request('GET', url);
});

module.exports.post = wrap(function (url, message) {
    return request('POST', url, message);
});
