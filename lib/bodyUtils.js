var querystring = require('querystring');

module.exports.parse = function (contentType, body) {
    // skip parameters
    var index = contentType.indexOf(';');
    if (index != -1) {
        contentType = contentType.substring(0, index);
    }
    switch (contentType) {
    case 'application/json':
        return JSON.parse(body);
    case 'application/x-www-form-urlencoded':
        return querystring.parse(body);
    default:
        throw new Error('Invalid content-type ' + contentType);
    }
};

module.exports.stringify = function (contentType, message) {
    switch (contentType) {
    case 'json':
    case 'application/json':
        return JSON.stringify(message, null, 4);
    case 'urlencoded':
    case 'application/x-www-form-urlencoded':
        return querystring.stringify(message);
    default:
        throw new Error('Invalid content-type ' + contentType);
    }
};
