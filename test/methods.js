var http = require('http');
var assert = require('assert');
var synchttp = require('../');

var port = 3000;

function startServer(done) {
    var server = http.createServer();
    server.on('request', function (request, response) {
        var message = {};
        response.writeHead(200, {'Content-Type': 'application/json'});
        message.method = request.method;
        response.end(JSON.stringify(message));
    });
    server.listen(port, '127.0.0.1', function () {
        done();
    });
}

describe('HTTP methods', function () {
    before(startServer);

    ['GET', 'POST', 'PUT', 'DELETE'].forEach(function (method) {
        it(method, function (done) {
            synchttp(function (http) {
                var response = http.port(port)[method.toLowerCase()]();
                assert.equal(response.method, method);
                done();
            });
        });
    });
});
