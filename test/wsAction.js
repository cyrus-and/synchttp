var assert = require('assert');
var server = require('./common/server.js');
var synchttp = require('../');

['application/json', 'application/x-www-form-urlencoded'].forEach(function (contentType) {
    describe('WebSocket ' + contentType, function () {
        var instance;

        before(function (done) {
            instance = server.ws({
                'hostname': 'localhost',
                'port': '3000',
                'contentType': contentType
            }, done);
        });

        after(function () {
            instance.close();
        });

        it('should send/receive', function (done) {
            synchttp(function (sh) {
                var message = {
                    'foo': 'bar'
                };
                sh.port(3000).wsContentType(contentType).ws();
                sh.send(message);
                var returnedMessage = sh.receive();
                assert.deepEqual(message, returnedMessage);
                done();
            });
        });
    });
});
