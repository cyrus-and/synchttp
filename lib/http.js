var Future = require('fibers/future');
var http = require('http');
var URL = require('url');

function wrap(funct) {
    return function () {
        return funct.apply(null, arguments).wait();
    };
}

function request(method, url, message) {
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
    if (typeof message !== 'undefined') {
        var stringMessage = JSON.stringify(message, null, 4);
        request.setHeader('Content-Length', stringMessage.length);
        request.end(stringMessage);
    } else {
        request.setHeader('Content-Length', 0);
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

module.exports.put = wrap(function (url, message) {
    return request('PUT', url, message);
});

module.exports.delete = wrap(function (url) {
    return request('DELETE', url);
});

module.exports.method = wrap(function (method, url, message) {
    return request(method, url, message);
});
