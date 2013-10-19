var M = function() {
    var that = this

    that.init = function(config, ev) {
        log('engine init')
        
        that.config = config
        that.ev = ev

        that.game_area = that.area.generate_empty()

        that.bindEvents()
    }

    that.bindEvents = function() {
        that.ev.on('socket.connected', function (id, socket) {
            if (true !== that.users.exists(id)) {
                that.users.add(id)

                socket.json.send({'event':'set', 'params':{
                    'area': that.area.toSimple(that.game_area),
                    'me': that.users.getParams(id),
                    'users': that.users.getAll()
                }})

                socket.broadcast.json.send({'event':'user.connected', 'user':that.users.getParams(id)})
            }
        })

        that.ev.on('socket.disconnected', function (uid, socket) {
            socket.broadcast.json.send({'event':'user.disconnected', 'user':that.users.getParams(uid)})
            that.users.remove(uid)
        })

        that.ev.on('socket.message.event', function () {
            // 
        })

        that.ev.on('socket.message.event move', function (message, uid, socket) {
            socket.broadcast.json.send({'event':'user.move', 'uid':uid, 'direction':message.direction})
        })

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
                hero: ['ericcartman', 'kylebroflovski', 'stanmarsh'][random(0,2)],
                pos: {
                    x: random(0, that.M.config.area.width),
                    y: random(0, that.M.config.area.height)
                }
            }
        }

        that.getParams = function (uid) {
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
    })(that)

    //
    that.area = new (function(M) {
        var that = this
        
        that.M = M
        that.data = {}

        that.types_separator = ":"

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
            'bullet': {
                type: 'shot',
                type_simple: 's'
            }
        }

        // @return [[..], [..], ..]
        that.generate_empty = function (uid) {
            var area = []

            var perc_blocks = 10

            for (var ix = 0; ix < that.M.config.area.height; ix++) {
                area[ix] = []
                for (var iy = 0; iy < that.M.config.area.width; iy++) {
                    var _type = 'empty'

                    if (random(0,100) <= perc_blocks) {
                        _type = 'block'
                    }

                    area[ix][iy] = that.types[_type]
                }
            }

            return area
        }

        // @return {separator}row{sep}row{sep}row{sep}...{sep}row
        that.toSimple = function (arr) {
            var area = []

            for (var kx in arr) {
                var area_row = []

                for (var ky in arr[kx]) {
                    area_row.push(arr[kx][ky].type_simple)
                }

                area.push(area_row.join(''))
            }

            return that.types_separator + area.join(that.types_separator)
        }
    })(that)
}

module.exports = new M
