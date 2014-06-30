var http = require('http');
var assert = require('assert');
var synchttp = require('../');

var port = 3000;

function startServer(done) {
    var server = http.createServer();
    server.on('request', function (request, response) {
        var incomingMessage;
        var outgoingMessage = {};
        response.writeHead(200, {'Content-Type': 'application/json'});
        switch (request.method) {
        case 'GET':
            outgoingMessage.path = request.url;
            response.end(JSON.stringify(outgoingMessage));
            break;
        case 'POST':
            request.on('readable', function () {
                var body = request.read().toString();
                incomingMessage = JSON.parse(body);
                response.end(JSON.stringify(incomingMessage));
            });
            break;
        }
    });
    server.listen(port, '127.0.0.1', function () {
        done();
    });
}

describe('HTTP methods', function () {
    before(startServer);

    it('GET', function (done) {
        synchttp(function (http) {
            var path = '/foo/bar/baz';
            var response = http.port(port).path(path).get();
            assert(response.path === path);
            done();
        });
    });

    it('POST', function (done) {
        synchttp(function (http) {
            var message = {
                'foo': 1,
                'bar': 2,
                'baz': 3
            };
            var response = http.port(port).post(message);
            assert(JSON.stringify(response) === JSON.stringify(message));
            done();
        });
    });
});
