var M = function() {
    var that = this

    that.init = function(config, ev) {
        log('engine init')
        
        that.config = config
        that.ev = ev

        that.area.init()

        that.bindEvents()
    }

    that.bindEvents = function() {
        // on connected
        that.ev.on('socket.connected', function (uid, socket) {
            if (true !== that.users.exists(uid)) {
                that.users.add(uid)

                socket.json.send({'event':'set', 'params':{
                    'area': that.area.toSimple(),
                    'me': uid,
                    'users': that.users.getAll(),
                    'settings': {
                        player: that.config.player
                    }
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

            var _move = that.users.move(uid, message.direction)

            if ('bomb' == _move) {
                socket.json.send({'event':'user.dead', 'uid':uid})
                socket.broadcast.json.send({'event':'user.dead', 'uid':uid})

                socket.json.send({'event':'set', 'params':{
                    'area': that.area.toSimple()
                }})
                socket.json.send({'event':'redraw'})
            }
        })

        // on user shoot
        that.ev.on('socket.message.event shoot', function (message, uid, socket) {
            socket.broadcast.json.send({'event':'user.shoot', 'uid':uid})
        })
    }

    //
    that.users = new (function(M) {
        var that = this
        
        that.M = M
        that.data = {}

        that.add = function (uid) {
            log('add user:', uid)

            that.data[uid] = {
                uid: uid,
                name: uid,
                // hero: ['ericcartman', 'kylebroflovski', 'stanmarsh'][random(0,2)],
                hero: ['1', '2'][random(0,1)],
                pos: {
                    x: random(0, that.M.config.area.width),
                    y: random(0, that.M.config.area.height)
                }
            }
        }

        that.get = function (uid) {
            return that.exists(uid) ? that.data[uid] : {}
        }

        that.getAll = function () {
            return that.data
        }

        that.exists = function (uid) {
            return typeof(that.data[uid]) !== 'undefined'
        }

        that.remove = function (uid) {
            delete that.data[uid]
        }

        that.move = function (uid, direction) {
            var newCoordsFunc = {
                'left': function (x,y) { return {'x':x-1, 'y':y} },
                'right': function (x,y) { return {'x':x+1, 'y':y} },
                'up': function (x,y) { return {'x':x, 'y':y-1} },
                'down': function (x,y) { return {'x':x, 'y':y+1} }
            }

            var player = that.get(uid)

            var oldCoords = {x:player.pos.x, y:player.pos.y}
            var newCoords = newCoordsFunc[direction](oldCoords.x, oldCoords.y)

            that.data[uid].pos.x = newCoords.x
            that.data[uid].pos.y = newCoords.y

            var cell = that.M.area.getCell(newCoords.x, newCoords.y)

            if (cell.type == 'bomb') {
                that.M.area.setCell(newCoords.x, newCoords.y, 'empty')
                return 'bomb'
            }
        }
    })(that)

    //
    that.area = new (function(M) {
        var that = this
        
        that.M = M
        that.data = {}

        that.types_separator = ':'

        that.types = {
            'player': {
                type: 'player',
                type_simple: 'p'
            },
            'empty': {
                type: 'empty',
                type_simple: 'e'
            },
            'block': {
                type: 'block',
                type_simple: 'b'
            },
            'bomb': {
                type: 'bomb',
                type_simple: 'm'
            },
            'bullet': {
                type: 'shot',
                type_simple: 's'
            }
        }

        that.init = function () {
            that.game_area = that.generate_empty()
        }

        // @return [[..], [..], ..]
        that.generate_empty = function (uid) {
            var area = []

            var perc_blocks = 10
            var perc_mines = 5

            for (var ix = 0; ix < that.M.config.area.height; ix++) {
                area[ix] = []
                for (var iy = 0; iy < that.M.config.area.width; iy++) {
                    var _type = 'empty'

                    if (random(0,100) <= perc_blocks) {
                        _type = 'block'
                    }

                    if (random(0,100) <= perc_mines) {
                        _type = 'bomb'
                    }

                    area[ix][iy] = that.types[_type]
                }
            }

            return area
        }

        // @return {separator}row{sep}row{sep}row{sep}...{sep}row
        that.toSimple = function () {
            var area = []

            for (var kx in that.game_area) {
                var area_row = []

                for (var ky in that.game_area[kx]) {
                    area_row.push(that.game_area[kx][ky].type_simple)
                }

                area.push(area_row.join(''))
            }

            return that.types_separator + area.join(that.types_separator)
        }

        //
        that.getCell = function (x,y) {
            return that.game_area[y-1][x-1]
        }

        //
        that.setCell = function (x,y, type) {
            that.game_area[y-1][x-1] = that.types[type]
        }
    })(that)
}

module.exports = new M
