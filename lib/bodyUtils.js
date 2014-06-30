module.exports.parse = function (contentType, body) {
    switch (contentType) {
    case 'application/json':
        return JSON.parse(body);
    default:
        throw new Error('Invalid content-type ' + contentType);
    }
};

module.exports.stringify = function (contentType, message) {
    switch (contentType) {
    case 'application/json':
        return JSON.stringify(message, null, 4);
    default:
        throw new Error('Invalid content-type ' + contentType);
    }
};
