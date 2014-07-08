var http = require('http');
var WebSocketServer = require('ws').Server;
var bodyUtils = require('../../lib/bodyUtils.js');

module.exports.http = function (options, done) {
    var server = http.createServer();
    server.on('request', function (request, response) {
        function sendResponse() {
            var stringMessage = bodyUtils.stringify(options.contentType, message);
            response.writeHead(200, {'content-type': options.contentType});
            response.end(stringMessage);
        }
        // fill in information
        var message = request.headers;
        message.method = request.method;
        message.url = request.url;
        // read the payload, if any
        var contentLength = request.headers['content-length'];
        if (typeof contentLength !== 'undefined' && contentLength > 0) {
            var payload = '';
            request.on('data', function (chunk) {
                payload += chunk;
            });
            request.on('end', function () {
                message.payload = payload;
                // pack and send the response
                sendResponse();
            });
        } else {
            // just pack and send the response; no payload
            sendResponse();
        }
    });
    server.listen(options.port, options.host, done);
    return server;
};

module.exports.ws = function (options, done) {
    var server = new WebSocketServer({
        'host': options.host,
        'port': options.port
    }, done);
    server.on('connection', function (ws) {
        ws.on('message', function (stringMessage) {
            // send the message back
            var message = bodyUtils.parse(options.contentType, stringMessage);
            ws.send(bodyUtils.stringify(options.contentType, message));
        });
    });
    return server;
};
