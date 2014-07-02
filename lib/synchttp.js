var Future = require('fibers/future');
var http = require('http');
var WebSocket = require('ws');
var querystring = require('querystring');
var URL = require('url');
var bodyUtils = require('./bodyUtils.js');

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
function httpRequest(method, options, hasBody, message, contentType) {
    var future = new Future();
    options.method = method;
    var request = http.request(options, function (response) {
        response.on('readable', function () {
            var body = response.read().toString();
            if (response.statusCode === 200) {
                try {
                    var contentType = response.headers['content-type'];
                    var message = bodyUtils.parse(contentType, body);
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
            try {
                var stringMessage = bodyUtils.stringify(contentType, message);
                request.setHeader('content-type', contentType);
                request.setHeader('content-length', stringMessage.length);
                request.end(stringMessage);
            } catch (err) {
                future.return(err);
            }
        } else {
            // the body is NOT supplied
            request.setHeader('content-length', 0);
            request.end();
        }
    } else {
        // this method does not allow the body
        request.end();
    }
    return future;
}

// synchronous connect to a WebSocket
function wsConnect(url) {
    var future = new Future();
    var ws = new WebSocket(url);
    ws.on('open', function () {
        ws.pause();
        future.return(ws);
    });
    ws.on('error', function (err) {
        future.return(err);
    });
    return future;
}

// asynchronous send through a WebSocket
function wsSend(ws, message, contentType) {
    if (typeof ws !== 'undefined') {
        var stringMessage = bodyUtils.stringify(contentType, message);
        ws.send(stringMessage);
    } else {
        throw new Error('WebSocket not connected');
    }
}

// synchronous receive from a WebSocket
function wsReceive(ws, contentType) {
    var future = new Future();
    if (typeof ws !== 'undefined') {
        ws.resume();
        ws.once('message', function (data, flags) {
            ws.pause();
            try {
                var message = bodyUtils.parse(contentType, data);
                future.return(message);
            } catch (err) {
                future.return(err);
            }
        });
    } else {
        future.return(new Error('WebSocket not connected'));
    }
    return future;
}

// add connection parameters that can be set in a "builder pattern" fashion;
// calling the methods without parameters will reset to the default value
function addParameter(name, defaultValue) {
    var self = this;
    self.setters[name] = function (x) {
        if (typeof x !== 'undefined') {
            self.parameters[name] = x;
        } else {
            self.parameters[name] = defaultValue;
        }
        return this; // the actual object!
    };
    self.setters[name].call(self);
}

// generate the options object to be used with the HTTP module of Node.js
function generateHttpOptions() {
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

// generate the web socket URL
function generateWsUrl() {
    var self = this;
    var options = generateHttpOptions.call(self);
    options.protocol = 'ws';
    return URL.format(options);
}

function Synchttp() {
    var self = this;
    self.setters = {};
    self.parameters = {};
    addParameter.call(self, 'httpContentType', 'application/json');
    addParameter.call(self, 'wsContentType', 'application/json');
    addParameter.call(self, 'host', 'localhost');
    addParameter.call(self, 'port', 3000);
    addParameter.call(self, 'path', '/');
    addParameter.call(self, 'query', {});
    addParameter.call(self, 'headers', {});
    addParameter.call(self, 'auth', undefined);
    self.webSockets = {};

    // HTTP

    self.httpGet = wrap(function () {
        var options = generateHttpOptions.call(self);
        return httpRequest('GET', options, false);
    });

    self.httpPost = wrap(function (message) {
        var options = generateHttpOptions.call(self);
        var contentType = self.parameters.httpContentType;
        return httpRequest('POST', options, true, message, contentType);
    });

    self.httpPut = wrap(function (message) {
        var options = generateHttpOptions.call(self);
        var contentType = self.parameters.httpContentType;
        return httpRequest('PUT', options, true, message, contentType);
    });

    self.httpDelete = wrap(function () {
        var options = generateHttpOptions.call(self);
        return httpRequest('DELETE', options, false);
    });

    // WebSocket

    self.wsConnect = function () {
        var url = generateWsUrl.call(self);
        var outcome = wsConnect(url).wait();
        if (outcome instanceof Error) {
            throw outcome;
        } else {
            self.webSockets[url] = outcome;
        }
    };

    self.wsSend = function (message) {
        var url = generateWsUrl.call(self);
        var ws = self.webSockets[url];
        return wsSend(ws, message, self.parameters.wsContentType);
    };

    self.wsReceive = wrap(function () {
        var url = generateWsUrl.call(self);
        var ws = self.webSockets[url];
        return wsReceive(ws, self.parameters.wsContentType);
    });

    self.wsCloseAll = function () {
        for (var url in self.webSockets) {
            var ws = self.webSockets[url];
            ws.close();
        }
    };
}

module.exports = Synchttp;
