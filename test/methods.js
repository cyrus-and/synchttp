var http = require('http');
var assert = require('assert');
var synchttp = require('../');

var server;

function startServer(port, done) {
    server = http.createServer();
    server.on('request', function (request, response) {
        var message = {};
        response.writeHead(200, {'Content-Type': 'application/json'});
        message.method = request.method;
        message.contentType = request.headers['content-type'];
        message.contentLength = request.headers['content-length'];
        message.hostPort = request.headers['host'];
        message.path = request.url;
        message.headers = request.headers;
        if (typeof message.contentLength !== 'undefined' && message.contentLength > 0) {
            request.on('readable', function () {
                message.body = request.read().toString();
                response.end(JSON.stringify(message));
            });

        } else {
            response.end(JSON.stringify(message));
        }
    });
    server.listen(port, '127.0.0.1', function () {
        done();
    });
}

function stopServer() {
    server.close();
}

describe('HTTP methods', function () {
    before(function (done) {
        startServer(3000, done);
    });
    after(stopServer);

    ['GET', 'POST', 'PUT', 'DELETE'].forEach(function (method) {
        it(method, function (done) {
            synchttp(function (http) {
                var response = http[method.toLowerCase()]();
                assert.equal(response.method, method);
                done();
            });
        });
    });
});

describe('Default parameters', function () {
    before(function (done) {
        startServer(3000, done);
    });
    after(stopServer);

    it('with body', function (done) {
        synchttp(function (http) {
            var response = http.post('foo');
            assert.equal(response.contentType, 'application/json');
            assert.equal(response.contentLength, response.body.length);
            assert.equal(response.hostPort, 'localhost:3000');
            assert.equal(response.path, '/');
            done();
        });
    });

    it('without body', function (done) {
        synchttp(function (http) {
            var response = http.post();
            assert.equal(response.contentType, undefined);
            assert.equal(response.contentLength, 0);
            assert.equal(response.hostPort, 'localhost:3000');
            assert.equal(response.path, '/');
            done();
        });
    });

    it('for methods that do not allow the body', function (done) {
        synchttp(function (http) {
            var response = http.get();
            assert.equal(response.contentType, undefined);
            assert.equal(response.contentLength, undefined);
            assert.equal(response.hostPort, 'localhost:3000');
            assert.equal(response.path, '/');
            done();
        });
    });
});

describe('Custom parameters', function () {
    before(function (done) {
        startServer(1337, done);
    });
    after(stopServer);

    it('with body', function (done) {
        synchttp(function (http) {
            var response = http
                .httpContentType('application/x-www-form-urlencoded')
                .host('127.0.0.1')
                .port('1337')
                .path('/foo?bar=baz')
                .headers({
                    'foo': 'bar'
                })
                .post({
                    'name': 'value'
                });
            assert.equal(response.contentType, 'application/x-www-form-urlencoded');
            assert.equal(response.contentLength, response.body.length);
            assert.equal(response.hostPort, '127.0.0.1:1337');
            assert.equal(response.path, '/foo?bar=baz');
            assert.equal(response.headers.foo, 'bar');
            done();
        });
    });

    it('without body', function (done) {
        synchttp(function (http) {
            var response = http
                .httpContentType('application/x-www-form-urlencoded')
                .host('127.0.0.1')
                .port('1337')
                .path('/foo?bar=baz')
                .headers({
                    'foo': 'bar'
                })
                .post();
            assert.equal(response.contentType, undefined);
            assert.equal(response.contentLength, 0);
            assert.equal(response.hostPort, '127.0.0.1:1337');
            assert.equal(response.path, '/foo?bar=baz');
            assert.equal(response.headers.foo, 'bar');
            done();
        });
    });

    it('for methods that do not allow the body', function (done) {
        synchttp(function (http) {
            var response = http
                .httpContentType('application/x-www-form-urlencoded')
                .host('127.0.0.1')
                .port('1337')
                .path('/foo?bar=baz')
                .headers({
                    'foo': 'bar'
                })
                .get();
            assert.equal(response.contentType, undefined);
            assert.equal(response.contentLength, undefined);
            assert.equal(response.hostPort, '127.0.0.1:1337');
            assert.equal(response.path, '/foo?bar=baz');
            assert.equal(response.headers.foo, 'bar');
            done();
        });
    });
});
