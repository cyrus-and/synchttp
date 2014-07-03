var Future = require('fibers/future');
var http = require('http');
var https = require('https');
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
function httpRequest(secure, method, options, hasBody, message, contentType) {
    var future = new Future();
    var connector = secure ? https : http;
    options.method = method;
    var request = connector.request(options, function (response) {
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end', function () {
            if (response.statusCode === 200) {
                try {
                    var contentType = response.headers['content-type'];
                    var message = bodyUtils.parse(contentType, body);
                    future.return(message);
                } catch (err) {
                    err.message += ': ' + body;
                    future.return(err);
                }
            } else {
                var err = new Error(response.statusCode);
                err.message += ': ' + body;
                future.return(err);
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
    var options = {
        'rejectUnauthorized': false,
    };
    var ws = new WebSocket(url, options);
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

// compute the port number also according to the secure flag
function getPort() {
    var self = this;
    if (typeof self.parameters.port === 'undefined') {
        return self.parameters.secure ? 443 : 80;
    } else {
        return self.parameters.port;
    }
}

// generate the options object to be used with the HTTP module of Node.js
function generateHttpOptions() {
    var self = this;
    var port = getPort.call(this);
    var path = URL.format({
        'pathname': self.parameters.path,
        'query': self.parameters.query
    });
    var options = {
        'hostname': self.parameters.host,
        'port': port,
        'path': path,
        'headers': self.parameters.headers,
        'auth': self.parameters.auth,
    };
    options.headers['user-agent'] = self.parameters.userAgent;
    return options;
}

// generate the web socket URL
function generateWsUrl() {
    var self = this;
    var port = getPort.call(this);
    var protocol = self.parameters.secure ? 'wss' : 'ws';
    return URL.format({
        'slashes': true,
        'protocol': protocol,
        'hostname': self.parameters.host,
        'port': port,
        'pathname': self.parameters.path,
        'query': self.parameters.query
    });
}

function Synchttp() {
    var self = this;
    self.setters = {};
    self.parameters = {};
    addParameter.call(self, 'userAgent', 'synchttp/0.0.1');
    addParameter.call(self, 'httpContentType', 'application/json');
    addParameter.call(self, 'wsContentType', 'application/json');
    addParameter.call(self, 'host', 'localhost');
    addParameter.call(self, 'secure', false);
    addParameter.call(self, 'port', undefined);
    addParameter.call(self, 'path', '/');
    addParameter.call(self, 'query', {});
    addParameter.call(self, 'headers', {});
    addParameter.call(self, 'auth', undefined);
    self.webSockets = {};

    // HTTP

    self.httpGet = wrap(function () {
        var options = generateHttpOptions.call(self);
        var secure = self.parameters.secure;
        return httpRequest(secure, 'GET', options, false);
    });

    self.httpPost = wrap(function (message) {
        var options = generateHttpOptions.call(self);
        var contentType = self.parameters.httpContentType;
        var secure = self.parameters.secure;
        return httpRequest(secure, 'POST', options, true, message, contentType);
    });

    self.httpPut = wrap(function (message) {
        var options = generateHttpOptions.call(self);
        var contentType = self.parameters.httpContentType;
        var secure = self.parameters.secure;
        return httpRequest(secure, 'PUT', options, true, message, contentType);
    });

    self.httpDelete = wrap(function () {
        var options = generateHttpOptions.call(self);
        var secure = self.parameters.secure;
        return httpRequest(secure, 'DELETE', options, false);
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
