var config = require('./config.js')

require('./helpers.js')

var express = require('express')
  , http = require('http')
  , app = express()
  , sass = require("node-sass")
  , path = require('path')
  , swig = require('swig')
  , events = require('events')

var ev = new events.EventEmitter()

var __wwwdir = path.normalize(__dirname + '/../www');
var __viewsdir = __dirname + '/views';

app.configure(function() {
    app.use(sass.middleware({
        src: __wwwdir + '/src'
      , dest: __wwwdir + '/'
      // , outputStyle: 'compressed'
      , debug: true
    }))
    app.use(express.static(__wwwdir))
})

var server = http.createServer(app)
  , io = require('socket.io').listen(server)

io.configure(function() {
    io.set("resource", "/"+config.server_resource);
    io.set("browser client minification", config.debug ? false : true);
    io.set('browser client etag', config.debug ? false : true);
    io.set('browser client gzip', config.debug ? false : true);
    io.set("heartbeats", true);
    // io.set("heartbeat timeout", 10);
    io.set("log level", config.debug ? 3/*debug*/ : 1/*warn*/);
    io.set('transports', ['websocket','flashsocket','htmlfile','xhr-polling','jsonp-polling']);
})


server.listen(config.server_port)

app.get('/', function(req, res){
    res.send(swig.renderFile(__viewsdir+'/index.html', {
        // pagename: 'awesome people',
        // authors: ['Paul', 'Jim', 'Jane']
    }))
})

app.get('/game', function(req, res){
    res.send(swig.renderFile(__viewsdir+'/game.html', {}))
})




require('./engine.js').init(config, ev)

io.sockets.on('connection', function (socket) {
    var uid = (socket.id).toString();
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