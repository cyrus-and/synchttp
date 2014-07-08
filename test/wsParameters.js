var assert = require('assert');
var os = require('os');
var server = require('./common/server.js');
var package = require('../package.json');
var bodyUtils = require('../lib/bodyUtils.js');
var synchttp = require('../');

describe('WebSocket default parameters', function () {
    var instance;

    before(function (done) {
        instance = server.ws({
            'host': 'localhost',
            'port': 3000
        }, done);
    });

    after(function () {
        instance.close();
    });

    it('should fail with port 80 (the real default)', function (done) {
        synchttp(function (sh) {
            assert.throws(sh.ws);
            done();
        });
    });

    it('should succeed (with the proper port)', function (done) {
        synchttp(function (sh) {
            sh.port(3000).ws();
            done();
        });
    });
});

describe('WebSocket custom parameters', function () {
    var instance;

    var address = (function () {
        var interfaces = os.networkInterfaces();
        for (var name in interfaces) {
            for (var i in interfaces[name]) {
                var address = interfaces[name][i];
                if (address.family === 'IPv4' && !address.internal) {
                    return address.address;
                }
            }
        }
    })();

    before(function (done) {
        instance = server.ws({
            'host': address,
            'port': 3000
        }, done);
    });

    after(function () {
        instance.close();
    });

    it('should succeed', function (done) {
        synchttp(function (sh) {
            sh.host(address).port(3000).ws();
            done();
        });
    });
});
