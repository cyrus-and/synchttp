var Future = require('fibers/future');
var http = require('http');
var querystring = require('querystring');
var URL = require('url');

// wrapper that makes a future-function "synchronous"
function wrap(funct) {
    return function () {
        // return objects and throw errors
        var outcome = funct.apply(null, arguments).wait();
        if (outcome instanceof Error) {
            throw outcome;
        } else {
            return outcome;
        }
    };
}

// general HTTP request method
function request(method, options, hasBody, message) {
    var future = new Future();
    options.method = method;
    var request = http.request(options, function (response) {
        response.on('readable', function () {
            var body = response.read().toString();
            if (response.statusCode === 200) {
                try {
                    var message = JSON.parse(body);
                    future.return(message);
                } catch (err) {
                    future.return(err);
                }
            } else {
                future.return(new Error(response.statusCode));
            }
        });
    });
    request.on('error', function (err) {
        future.return(err);
    });
    if (hasBody) {
        if (typeof message !== 'undefined') {
            // the body is supplied
            var stringMessage = JSON.stringify(message, null, 4);
            request.setHeader('Content-Type', 'application/json');
            request.setHeader('Content-Length', stringMessage.length);
            request.end(stringMessage);
        } else {
            // the body is NOT supplied
            request.setHeader('Content-Length', 0);
            request.end();
        }
    } else {
        // this method does not allow the body
        request.end();
    }
    return future;
}

// add connection parameters that can be set in a "builder pattern" fashion;
// calling the methods without parameters will reset to the default value
function addParameter(name, defaultValue) {
    var self = this;
    Synchttp.prototype[name] = function (x) {
        var self = this;
        if (typeof x !== 'undefined') {
            self.parameters[name] = x;
        } else {
            self.parameters[name] = defaultValue;
        }
        return self;
    };
    self[name]();
}

// generate the options object to be used with the HTTP module of Node.js
function generateOptions() {
    var self = this;
    var queryString = querystring.stringify(self.parameters.query);
    return {
        'hostname': self.parameters.host,
        'port': self.parameters.port,
        'path': self.parameters.path + queryString,
        'headers': self.parameters.headers,
        'auth': self.parameters.auth,
    };
}

function Synchttp() {
    var self = this;
    self.parameters = {};
    addParameter.call(self, 'host', 'localhost');
    addParameter.call(self, 'port', 3000);
    addParameter.call(self, 'path', '/');
    addParameter.call(self, 'query', {});
    addParameter.call(self, 'headers', {});
    addParameter.call(self, 'auth', undefined);

    self.get = wrap(function () {
        var options = generateOptions.call(self);
        return request('GET', options, false);
    });

    self.post = wrap(function (message) {
        var options = generateOptions.call(self);
        return request('POST', options, true, message);
    });

    self.put = wrap(function (message) {
        var options = generateOptions.call(self);
        return request('PUT', options, true, message);
    });

    self.delete = wrap(function () {
        var options = generateOptions.call(self);
        return request('DELETE', options, false);
    });
}

module.exports = Synchttp;
