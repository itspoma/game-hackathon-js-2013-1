var M = function() {
    var that = this

    that.data = {}

    that.init = function(config, ev) {
        log('engine init')

        that.config = config
        that.ev = ev

        that.area.init()

        that.bindEvents()

        return that
    }

    //
    that.set = function (name, value) {
        that.data[name] = value

        return that
    }

    that.bindEvents = function() {
        // on connected
        that.ev.on('socket.connected', function (uid, socket) {
            if (true !== that.users.exists(uid)) {
                that.users.add(uid)

                // @todo: send few events in one response
                socket.json.send({'event':'set', 'params':{
                    'area': that.area.toSimplePacked(),
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
                that.data['io'].sockets.json.send({'event':'user.dead', 'uid':uid, 'pos':{x:moved.toX, y:moved.toY}})
            }

            if ('bonus' == moved.toCell) {
                that.data['io'].sockets.json.send({'event':'user.bonus', 'uid':uid, 'pos':{x:moved.toX, y:moved.toY}})
            }
        })

        // on user shoot
        that.ev.on('socket.message.event shoot', function (message, uid, socket) {
            socket.broadcast.json.send({'event':'user.shoot', 'uid':uid})
        })
    }

    //
    that.heroes = new (function(M) {
        var that = this

        that.M = M
        that.data = {}

        that.heroes = {
            'eric_cartman': {
                'id': 'eric_cartman'
            },
            'kyle_broflovski': {
                'id': 'kyle_broflovski'
            },
            'kenny_mccormick': {
                'id': 'kenny_mccormick'
            },
            'leopold_butters_stotch': {
                'id': 'leopold_butters_stotch'
            },
            'tank1': {
                'id': 'tank1'
            }
        }

        that.getRandom = function () {
            var heroesArr = keys(that.heroes)
            return that.heroes[heroesArr[random(0,heroesArr.length-1)]]
        }

    })(that)

    //
    that.users = new (function(M) {
        var that = this
        
        that.M = M
        that.data = {}

        that.add = function (uid) {
            log('add user:', uid)

            var _hero = that.M.heroes.getRandom()
            var _pos = that.M.area.getFreeCell()

            that.data[uid] = {
                uid: uid,
                name: uid,
                hero: _hero.id,
                pos: _pos
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

            var _return = {
                toX: newCoords.x,
                toY: newCoords.y,
                toCell: cell.type
            }

            if (cell.type == 'bomb'
                || cell.type == 'bonus')
            {
                that.M.area.setCell(newCoords.x, newCoords.y, 'empty')
            }

            return _return
        }
    })(that)

    //
    that.area = new (function(M) {
        var that = this
        
        that.M = M
        that.data = {}

        that.types_separator = ':'
        that.packed_separator = '@'

        that.types = {
            'player': {
                type: 'player',
                type_simple: 'p',
                u_can_move_through: false
            },
            'empty': {
                type: 'empty',
                type_simple: 'e'
            },
            'block': {
                type: 'block',
                type_simple: 'b',
                u_can_move_through: false
            },
            'bomb': {
                type: 'bomb',
                type_simple: 'm'
            },
            'bonus': {
                type: 'bonus',
                type_simple: 'o'
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

            var perc_blocks = 5
            var perc_mines = 3
            var perc_bonus = 2

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

                    if (random(0,100) <= perc_bonus) {
                        _type = 'bonus'
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

            var simpleArea = that.types_separator + area.join(that.types_separator)

            return simpleArea
        }

        // @return packet version of map for user
        that.toSimplePacked = function () {
            var simpleArea = that.toSimple()

            var sep = that.packed_separator

            // pack
            for (var k in that.types) {
                var v = that.types[k]

                // bbbb => !b3
                // bbb => bbb
                simpleArea = simpleArea.replace(new RegExp('['+v.type_simple+']{4,}', 'g'), function(m) {
                    var m_packed = sep + m.substr(0,1) + m.length + sep
                    var isProfitably = m_packed.length < m.length

                    if (isProfitably) {
                        return m_packed
                    }
                    else {
                        return m
                    }
                })
            }

            simpleArea = sep + simpleArea

            return simpleArea
        }

        //
        that.getFreeCell = function () {
            var _pos = null

            var _while = 0
            while (!_pos) {
                if (++_while >= 50) break

                var _x = random(0, that.M.config.area.width)
                var _y = random(0, that.M.config.area.height)

                var cell = that.getCell(_x, _y)

                if ('empty' == cell.type) {
                    _pos = {
                        x: _x,
                        y: _y
                    }
                }
            }

            return _pos
        }

        //
        that.getCell = function (x,y) {
            if (!that.game_area) {
                return {}
            }

            if (typeof that.game_area[y-1] == 'undefined') {
                return {}
            }

            return that.game_area[y-1][x-1]
        }

        //
        that.setCell = function (x,y, type) {
            that.game_area[y-1][x-1] = that.types[type]
        }

        // @return: {a: {}, b:{}, ..}
        that.getCellTypes = function () {
            // sf : map small <=> full
            // fs : map full <=> full
            var types = {sf:{}, fs:{}}

            for (var k in that.types) {
                var v = that.types[k]

                var _sf_p = {
                    stype: v.type_simple,
                    type: v.type
                }
                if ((v.u_can_move_through&&true) == false) {
                    _sf_p.canmove = false
                }
                
                types.sf[v.type_simple] = _sf_p

                types.fs[v.type] = v.type_simple
            }

            return types
        }
    })(that)
}

module.exports = new M
