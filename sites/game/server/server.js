var config = require('./config.js')
    config.debug = process.argv.indexOf('-debug') !== -1
    config.logLevel = config.debug ? 0/*DEBUG*/ : config.logLevel

//
var express = require('express')
  , http = require('http')
  , app = express()
  , sass = require("node-sass")
  , path = require('path')
  , events = require('events')
  , swig = require('swig')

//
global.__dir = __dirname
global.__wwwdir = path.normalize(__dir + '/../www')

require('fs').readdirSync(__dir+'/helpers').forEach(function(file) {
  require(__dir + '/helpers/' + file)
})

//
var ev = new events.EventEmitter()

//
swig.setDefaults({
  locals: {
    debug: config.debug
  }
});

//
app.configure(function() {
    app.use(sass.middleware({
        src: __wwwdir + '/src'
      , dest: __wwwdir + '/'
      , outputStyle: config.debug ? 'compact' : 'compressed'
      , debug: config.debug
    }))

    app.use(express.methodOverride())
    app.use(app.router)
    app.use(express.static(__wwwdir))
})

//
var server = http.createServer(app)
  , io = require('socket.io').listen(server)

//
io.configure(function() {
    io.set("resource", "/"+config.server_resource)
    io.set("browser client minification", config.debug ? false : true)
    io.set('browser client etag', config.debug ? false : true)
    io.set('browser client gzip', config.debug ? false : true)
    io.set("heartbeats", true)
    io.set("log level", config.logLevel == 0 ? 3/*debug*/ : 1/*warn*/)
    io.set('transports', ['websocket','flashsocket','htmlfile','xhr-polling','jsonp-polling'])
})

//
app.all('/*', function(req, res, next) {
    if (typeof global['500'] != 'undefined'
        && global['500'] === true)
    {
      res.send(500)
      return
    }

    next()
})

//
require('./routes')(app)

//
server.listen(config.server_port)

//
try {

  //
  require('./engine.js')
    .set('io', io)
    .set('ev', ev)
    .init(config)

  //
  io.sockets.on('connection', function (socket) {
      var uid = (socket.id).toString()
      log.info('connected', uid)

      ev.emit('socket.connected', uid, socket)

      socket.on('message', function (message, callback) {
          log.debug('message', uid, message)

          ev.emit('socket.message.event', uid, socket)

          if (typeof message.event != 'undefined') {
              ev.emit('socket.message.event '+message.event, message, uid, socket)
          }
      })

      socket.on('disconnect', function () {
          log.info('disconnected')

          ev.emit('socket.disconnected', uid, socket)
      })
  })

}
catch(e) {
  if (config.debug) {
    throw e
  }

  log.err(e.message.red.bold, logLevel.ERR)

  global['500'] = true
}