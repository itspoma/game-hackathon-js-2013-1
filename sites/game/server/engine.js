var M = function() {
    var that = this

    that.data = {}

    that.init = function(config) {
        log.err('engine init')

        that.config = config

        that.loadModules()
        that.bindEvents()

        that.area.init()

        return that
    }

    //
    that.set = function (name, value) {
        that[name] = value

        return that
    }

    //
    that.loadModules = function () {
        var modules = ['heroes','users','area'];

        for (var k in modules) {
            var moduleName = modules[k]
            var moduleClass = require('./engine/'+moduleName+'.js')(that)

            this.set(moduleName, moduleClass)
        }
    }

    //
    that.bindEvents = function() {
        // on connected
        that.ev.on('socket.connected', function (uid, socket) {
            if (true !== that.users.exists(uid)) {
                that.users.add(uid)

                // @todo: send few events in one response
                socket.json.send({'event':'set', 'params':{
                    'area': that.area.toSimplePacked(),
                    'area_name': that.area.mapName,
                    'cell_types': that.area.getCellTypes(),
                    'me': uid,
                    'users': that.users.getAll(),
                    'settings': {
                        player: that.config.player
                    },
                }})
                socket.json.send({'event':'redraw'})

                socket.broadcast.json.send({'event':'user.connected', 'user':that.users.get(uid)})
            }
        })

        // on disconnected
        that.ev.on('socket.disconnected', function (uid, socket) {
            socket.broadcast.json.send({'event':'user.disconnected', 'user':that.users.get(uid)})
            that.users.remove(uid)
        })

        // global message event
        that.ev.on('socket.message.event', function () {
            //
        })

        // on user move
        that.ev.on('socket.message.event move', function (message, uid, socket) {
            socket.broadcast.json.send({'event':'user.move', 'uid':uid, 'direction':message.direction})

            var moved = that.users.move(uid, message.direction)

            if ('bomb' == moved.toCell) {
                that.io.sockets.json.send({'event':'user.dead', 'uid':uid, 'pos':{x:moved.toX, y:moved.toY}})
            }

            if ('bonus' == moved.toCell) {
                that.io.sockets.json.send({'event':'user.bonus', 'uid':uid, 'pos':{x:moved.toX, y:moved.toY}})
            }
        })

        // on user shoot
        that.ev.on('socket.message.event shoot', function (message, uid, socket) {
            socket.broadcast.json.send({'event':'user.shoot', 'uid':uid, 'direction':message.direction})
        })

        //
        that.ev.on('socket.message.event user.kill', function (message, uid, socket) {
            socket.broadcast.json.send({'event':'user.kill', 'killer':uid, 'killed':message.uid})
        })   
    }
}

module.exports = new M
