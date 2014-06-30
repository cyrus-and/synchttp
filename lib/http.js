var Future = require('fibers/future');
var http = require('http');
var URL = require('url');

function wrap(funct) {
    return function () {
        return funct.apply(null, arguments).wait();
    };
}

function request(method, url, hasBody, message) {
    var future = new Future();
    var options = URL.parse(url);
    options.method = method;
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
    if (hasBody) {
        if (typeof message !== 'undefined') {
            var stringMessage = JSON.stringify(message, null, 4);
            request.setHeader('Content-Type', 'application/json');
            request.setHeader('Content-Length', stringMessage.length);
            request.end(stringMessage);
        } else {
            request.setHeader('Content-Length', 0);
            request.end();
        }
    } else {
        request.end();
    }
    return future;
}

module.exports.get = wrap(function (url) {
    return request('GET', url, false);
});

module.exports.post = wrap(function (url, message) {
    return request('POST', url, true, message);
});

module.exports.put = wrap(function (url, message) {
    return request('PUT', url, true, message);
});

module.exports.delete = wrap(function (url) {
    return request('DELETE', false, url);
});

module.exports.method = wrap(function (method, url, hasBody, message) {
    return request(method, url, hasBody, message);
});
