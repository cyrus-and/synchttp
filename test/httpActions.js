var assert = require('assert');
var server = require('./common/server.js');
var synchttp = require('../');

describe('HTTP methods', function () {
    var instance;

    before(function (done) {
        instance = server.http({
            'hostname': 'localhost',
            'port': '3000',
            'contentType': 'application/json',
        }, done);
    });

    after(function () {
        instance.close();
    });

    ['GET', 'POST', 'PUT', 'DELETE'].forEach(function (method) {
        it(method, function (done) {
            synchttp(function (sh) {
                var response = sh.port(3000)[method.toLowerCase()]();
                assert.equal(response.method, method);
                done();
            });
        });
    });
});

describe('content-length and content-type', function () {
    var instance;

    before(function (done) {
        instance = server.http({
            'hostname': 'localhost',
            'port': '3000',
            'contentType': 'application/json',
        }, done);
    });

    after(function () {
        instance.close();
    });

    it('should not be there for GET-like methods', function (done) {
        synchttp(function (sh) {
            var response = sh.port(3000).get();
            assert.equal(typeof response['content-type'], 'undefined');
            assert.equal(typeof response['content-length'], 'undefined');
            done();
        });
    });

    it('should be 0 for POST-like methods without body', function (done) {
        synchttp(function (sh) {
            var response = sh.port(3000).post();
            assert.equal(typeof response['content-type'], 'undefined');
            assert.equal(response['content-length'], 0);
            done();
        });
    });

    it('should be set for POST-like methods with body', function (done) {
        synchttp(function (sh) {
            var response = sh.port(3000).post({
                'foo': 'bar'
            });
            assert(typeof response['content-type'] !== 'undefined');
            assert.equal(response['content-length'], response['payload'].length);
            done();
        });
    });
});
