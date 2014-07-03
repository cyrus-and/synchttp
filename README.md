synchttp
========

Synchronous Node.js HTTP for API testing/scripting/automation.

Installation
------------

    npm install synchttp

Sample API usage
----------------

### Top 10 "interestingness" photos from Flickr

This snippet fetches a list of 10 images from Flickr and dump: title, owned and
URL. An additional request is performed to fetch the user name.

```javascript
var synchttp = require('synchttp');
var API_KEY = '<YOUR APP KEY>';

synchttp(function (sh) {
    var response = sh
        .secure(true)
        .host('api.flickr.com')
        .path('/services/rest/')
        .query({
            'api_key': API_KEY,
            'method': 'flickr.interestingness.getList',
            'format': 'json',
            'nojsoncallback': 1,
            'per_page': 10
        }).get();
    response.photos.photo.forEach(function (photo) {
        var user = sh.query({
            'api_key': API_KEY,
            'method': 'flickr.people.getInfo',
            'format': 'json',
            'nojsoncallback': 1,
            'user_id': photo.owner
        }).get();
        console.log(
            '"%s" by "%s"\n[https://www.flickr.com/photos/%s/%s]\n',
            photo.title,
            user.person.username._content,
            photo.owner,
            photo.id
        );
    });
});
```

### WebSocket echo test

This is a demonstration of a simple WebSocket echo test.

```javascript
var synchttp = require('synchttp');

synchttp(function (sh) {
    sh.secure(true).host('echo.websocket.org').ws();
    sh.send({ 'hello': 'world', 'number': 1 });
    sh.send({ 'hello': 'world', 'number': 2 });
    sh.send({ 'hello': 'world', 'number': 3 });
    console.log(sh.receive().number);
    console.log(sh.receive().number);
    console.log(sh.receive().number);
});
```

### Blog API

Assume you have a dummy API for your blog that allows you to create a post and
then to add some tags:

    POST /api/posts/               # title, body
    POST /api/posts/:post_id/tags/ # label
    GET  /api/posts/:post_id

In the following snippet, the id of the new post is used to add the tags and to
finally fetch the whole post resource.

```javascript
var synchttp = require('synchttp');

synchttp(function (sh) {
    var response = sh.path('/api/posts/').post({
        'title': 'Awesome post',
        'body': 'Lorem ipsum...'
    });

    // the path is kept across the following requests...
    sh.path('/api/posts/' + response.id + '/tags/');
    ['nodejs', 'javascript', 'sh'].forEach(function (tag) {
        // ... so only the body is needed here!
        sh.post({
            'label': tag
        });
    });

    var post = sh.path('/api/posts/' + response.id).get();
    console.log(JSON.stringify(post, null, 4));
});
```

This would result in something like:

```json
{
    "_id": "53b1ab76b2029860505e2c18",
    "title": "Awesome post",
    "body": "Lorem ipsum...",
    "tags": [
        {
            "_id": "53b1ab76b2029860505e2c19",
            "label": "nodejs"
        },
        {
            "_id": "53b1ab76b2029860505e2c1a",
            "label": "javascript"
        },
        {
            "_id": "53b1ab76b2029860505e2c1b",
            "label": "http"
        }
    ]
}
```

API
---

### Content types

Define how raw incoming/outgoing data should be parsed/formatted.

Actually supported:

 - `application/json` or `json`;
 - `application/x-www-form-urlencoded` or `urlencoded`.

### module(callback)

Single entry point of this module, it runs `callback` in a synchronous
environment.

`callback` takes an object of type `Synchttp`.

### Class: Synchttp

This object is used to issue HTTP commands to the server, and it maintains a set
of connection parameters so there is no need to repeat parameters that do not
change in every request.

```javascript
synchttp(function (sh) {
    sh.host('example.com');
    sh.path('/foo').get(); // GET http://example.com/foo
    sh.path('/bar').get(); // GET http://example.com/bar
    sh.path('/baz').get(); // GET http://example.com/baz
});
```

Parameters are set by calling method on this object, a sort of builder pattern
can be used. Only the final actions (`get`, `post`, etc.) actually perform the
communication:

```javascript
synchttp(function (sh) {
    sh.host('example.com').port(1337).path('/foo/bar/baz').post({
        'name': 'value'
    });
});
```

Parameters come with a default value, if the corresponding method is called
without arguments then the default value is restored:

```javascript
synchttp(function (sh) {
    sh.host('example.com').get(); // GET http://example.com/
    sh.host().get(); // GET http://localhost/
});
```

#### Connection parameters

##### userAgent([userAgent])

Default `synchttp/<version>`.

Define the `User-Agent` to be send along with the HTTP requests.

##### httpContentType([contentType])

Default `application/json`.

Define the content type to be used when sending messages to the server. For
incoming messages instead the `Content-Type` header is used.

##### wsContentType([contentType])

Default `application/json`.

Define the content type to be used when sending/receiving messages to/from the
server.

##### host([host])

Default `localhost`.

Define the host to be reached.

##### secure([secure])

Default `false`.

Define whether a secure connection should be used or not..

##### port([port])

Default `80` or `443` according to the `secure` parameter.

Define the host port to be reached.

##### path([path])

Default `/`.

Define the path component of the URL to query.

##### query([query])

Default `{}`.

Define the key-value pairs to be used as query string.

##### headers([headers])

Default `{}`.

Define the key-value pairs to be used as HTTP headers.

##### auth([auth])

Default `undefined` (no authentication).

Define the basic HTTP authentication to use.

#### HTTP Actions

These methods return the received payload as a JavaScript object according to
the `Content-Type` returned by the server (if possible). An exception of type
`Error` is thrown in case of errors.

##### get()

Perform an HTTP `GET`.

##### post(message)

Perform an HTTP `POST`.

##### put(message)

Perform an HTTP `PUT`.

##### delete()

Perform an HTTP `DELETE`.

#### WebSocket actions

Send and receive messages through WebSockets; messages are properly
parsed/formatted according to the value of the `wsContentType` parameter.

##### ws()

Try to establish a WebSocket to the server. A new WebSocket is created whenever
this method is called with a different resulting URL (according to the
connection parameters).

##### send(message)

Send a message through the WebSocket.

##### receive()

Receive a message from the WebSocket.
