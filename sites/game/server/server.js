var config = require('./config.js')

// global helpers
require('./helpers.js')

var express = require('express')
  , http = require('http')
  , app = express()
  , sass = require("node-sass")
  , path = require('path')
  , events = require('events')

//

var ev = new events.EventEmitter()

var __wwwdir = path.normalize(__dirname + '/../www')

app.configure(function() {
    app.use(sass.middleware({
        src: __wwwdir + '/src'
      , dest: __wwwdir + '/'
      , outputStyle: config.debug ? 'compact' : 'compressed'
      , debug: config.debug
    }))

    app.use(express.static(__wwwdir))
})

var server = http.createServer(app)
  , io = require('socket.io').listen(server)

io.configure(function() {
    io.set("resource", "/"+config.server_resource)
    io.set("browser client minification", config.debug ? false : true)
    io.set('browser client etag', config.debug ? false : true)
    io.set('browser client gzip', config.debug ? false : true)
    io.set("heartbeats", true)
    io.set("log level", config.debug ? 3/*debug*/ : 1/*warn*/)
    io.set('transports', ['websocket','flashsocket','htmlfile','xhr-polling','jsonp-polling'])
})

server.listen(config.server_port)

var routes = require('./routes')
for (var k in routes.map) {
  app.get(k, routes[routes.map[k]])
}

//

require('./engine.js')
  .set('io', io)
  .init(config, ev)

io.sockets.on('connection', function (socket) {
    var uid = (socket.id).toString()
    log('connected', uid)

    ev.emit('socket.connected', uid, socket)

    socket.on('message', function (message, callback) {
        log('message', uid, message)

        ev.emit('socket.message.event', uid, socket)

        if (typeof message.event != 'undefined') {
            ev.emit('socket.message.event '+message.event, message, uid, socket)
        }
    })

    socket.on('disconnect', function () {
        log('disconnected')

        ev.emit('socket.disconnected', uid, socket)
    })
})