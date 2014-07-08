var assert = require('assert');
var os = require('os');
var server = require('./common/server.js');
var package = require('../package.json');
var bodyUtils = require('../lib/bodyUtils.js');
var synchttp = require('../');

describe('HTTP default parameters', function () {
    var instance;

    before(function (done) {
        instance = server.http({
            'host': 'localhost',
            'port': 3000,
            'contentType': 'application/json',
        }, done);
    });

    after(function () {
        instance.close();
    });

    it('should fail with port 80 (the real default)', function (done) {
        synchttp(function (sh) {
            assert.throws(sh.get);
            done();
        });
    });

    it('should match expected values (except for the port)', function (done) {
        synchttp(function (sh) {
            var response = sh.port(3000).post({
                'post-name': 'post-value'
            });
            assert.equal(response['user-agent'], package.name + '/' + package.version);
            assert.equal(response['host'], 'localhost:3000');
            assert.equal(response['url'], '/');
            assert.equal(response['content-type'], 'application/json');
            done();
        });
    });
});

describe('HTTP custom parameters', function () {
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
        instance = server.http({
            'host': address,
            'port': 3000,
            'contentType': 'application/x-www-form-urlencoded',
        }, done);
    });

    after(function () {
        instance.close();
    });

    it('should match custom values', function (done) {
        synchttp(function (sh) {
            var postData = {
                'post-name': 'post-value'
            };
            var response = sh
                .userAgent('user/agent')
                .httpContentType('application/x-www-form-urlencoded')
                .host(address)
                .port(3000)
                .path('/a/b/c')
                .query({
                    'query-name': 'query-value'
                })
                .headers({
                    'header-name': 'header-value'
                })
                .auth('user:password')
                .post(postData);
            assert.equal(response['header-name'], 'header-value');
            assert.equal(response['user-agent'], 'user/agent');
            assert.equal(response['host'], address + ':3000');
            assert.equal(response['authorization'], 'Basic ' + new Buffer('user:password').toString('base64'));
            assert.equal(response['content-type'], 'application/x-www-form-urlencoded');
            assert.equal(response['url'], '/a/b/c?query-name=query-value');
            assert.equal(response['payload'], bodyUtils.stringify('application/x-www-form-urlencoded', postData));
            done();
        });
    });
});
