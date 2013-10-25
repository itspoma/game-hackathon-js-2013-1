define(function(require, exports, module){
    var jquery = require('jquery')
      , events = require('events')
      , socket = require('socket')
      , tmp1 = require('keypress')
      , tmp2 = require('jquery-rotate')

    var Module = function(config) {
        var that = this

        that.config = module.config()
        that.data = {}

        window.engine = that

        that.init = function () {
            log('game init')

            that.bindEvents()
            that.redraw()

            that.start()
        }

        that.start = function () {
            log('game start')

            that.sock = new socket()
            that.sock.connect()
        }

        that.redraw = function () {
            that.area.redraw()
            that.users.redraw()
        }

        that.bindEvents = function () {
            // connecting
            events.addListener(['socket.connecting', 'socket.reconnecting'], function() {
                $('body').addClass('loading')

                $('#area #users').html('')
                $('#area #table').html('')
                $('#area #actions').html('')
            })

            // connect
            events.addListener(['socket.connect', 'socket.reconnect'], function() {
                $('body').removeClass('loading')
            })

            // set
            events.addListener('socket.event set', function (message, cb) {
                var params = message.params

                for (var k in params) {
                    var v = params[k]
                    that.data[k] = v

                    log('game set "'+k+'"', v)
                }
            })

            // redraw
            events.addListener('socket.event redraw', function (message, cb) {
                that.redraw()
            })

            // redraw user
            events.addListener('socket.event redraw.user', function (message, cb) {
                that.users.redraw()
            })

            // redraw area
            events.addListener('socket.event redraw.area', function (message, cb) {
                that.area.redraw()
            })

            // user.connected
            events.addListener('socket.event user.connected', function (message, cb) {
                that.users.add(message.user)
            })

            // user.disconnected
            events.addListener('socket.event user.disconnected', function (message, cb) {
                that.users.remove(message.user)
            })

            // move
            var directionKeys = ['left', 'right', 'up', 'down']
            for (var k in directionKeys) {
                var key = directionKeys[k]

                ;(function(key){
                    keypress.combo(key, function() {
                        if (true == that.users.move('me', key)) {
                            that.sock.message({'event':'move', 'direction':key})
                        }
                    }, true)
                })(key)
            }

            // user.move
            events.addListener('socket.event user.move', function (message, cb) {
                var uid = message.uid
                var direction = message.direction

                that.users.move(uid, direction)
            })

            // keypress.sequence_combo("a a z x c", function() {
            //     alert(1)
            // }, true)

            keypress.combo('space', function() {
                if (true == that.users.shoot('me')) {
                    // that.sock.message({'event':'shoot'})
                }
            })

            // on shoot
            events.addListener('socket.event user.shoot', function (message, cb) {
                // var userId = message.uid                
                // Gun.shoot(userId)
            })

            // on dead
            events.addListener('socket.event user.dead', function (message, cb) {
                if (message.uid == that.data.me) {
                    log('you dead')
                }
                else {
                    that.area.setCell(message.pos.x, message.pos.y, 'player')
                    log('user '+message.uid+' dead')
                }
            })

            // on bonus
            events.addListener('socket.event user.bonus', function (message, cb) {
                if (message.uid == that.data.me) {
                    log('you get bonus')
                }
                else {
                    that.area.setCell(message.pos.x, message.pos.y, 'player')
                    log('user '+message.uid+' get bonus')
                }
            })
        }

        //
        that.users = new (function(Module) {
            var that = this
            
            that.M = Module

            that.add = function (user) {
                that.M.data.users[user.uid] = user;

                var isMe = that.getMe().data.uid === user.uid
                var cellEl = that.M.area.getCell(user.pos.x, user.pos.y).el

                var el = $('<div/>')
                            .attr('id', 'player_'+user.uid)
                            .addClass('player')
                            .addClass(isMe?'player_me':null)
                            .addClass('hero_'+user.hero)
                            .css('left', cellEl.position().left)
                            .css('top', cellEl.position().top)

                $('#area #users').append(el)

                that.M.area.setCell(user.pos.x, user.pos.y, 'player')
            }

            that.remove = function (user) {
                if (true !== this.exists(user.uid)) return

                var player = that.getPlayer(user.uid)

                player.el.remove()
                that.M.area.setCell(player.data.pos.x, player.data.pos.y, 'empty')
            }

            that.redraw = function () {
                for (var uid in that.getAll()) {
                    var isMe = that.getMe().data.uid === uid
                    var player = that.getPlayer(uid)

                    player.data && that.remove(player.data.uid)

                    that.add(player.data)
                }
            }

            that.canMove = function(toX, toY) {
                var cell = that.M.area.getCell(toX, toY)

                return cell.type && cell.type.canmove
            }

            that.move = function (who, direction) {
                var timeNow = (new Date()).getTime()

                var player = 'me' === who ? that.getMe() : that.getPlayer(who)

                if ('me' === who && player.data.lastMove) {
                    if (timeNow - player.data.lastMove < that.M.data.settings.player.fps) {
                        return false
                    }
                }

                var offset = (player.el.width() + 0) + 'px'

                var newCoordsMap = {
                    'left': {x:-1, y:0, angle:270},
                    'right': {x:+1, y:0, angle:90},
                    'up': {x:0, y:-1, angle:0},
                    'down': {x:0, y:+1, angle:180}
                }

                var oldCoords = {x:player.data.pos.x, y:player.data.pos.y}

                var newCoordsP = newCoordsMap[direction]
                var newCoords = {
                    x: oldCoords.x + newCoordsP.x,
                    y: oldCoords.y + newCoordsP.y
                }

                if (true !== that.canMove(newCoords.x, newCoords.y)) {
                    return false
                }

                player.el.attr('direction', direction)
                player.el.rotate({angle: newCoordsP.angle})

                that.M.area.setCell(oldCoords.x, oldCoords.y, 'empty')
                that.M.area.setCell(newCoords.x, newCoords.y, 'player')

                if ('me' === who) {
                    that.M.data.users[that.M.data.me].pos.x = newCoords.x
                    that.M.data.users[that.M.data.me].pos.y = newCoords.y
                    that.M.data.users[that.M.data.me].lastMove = timeNow
                }
                else {
                    that.M.data.users[who].pos.x = newCoords.x
                    that.M.data.users[who].pos.y = newCoords.y
                }

                var directionFuncs = {
                    'left': ['left', '-'],
                    'right':  ['left', '+'],
                    'up': ['top', '-'],
                    'down': ['top', '+'],
                }

                var directionP = directionFuncs[direction]

                var _css = {}
                    _css[directionP[0]] = directionP[1] + '=' + offset

                player.el.css(_css)

                return true
            }

            that.shoot = function (who, direction) {
                var user = 'me' === who ? that.getMe() : that.getPlayer(who)

                if ('me' === who) {
                    direction = user.el.attr('direction') || 'up'
                }

                var userSize = (user.el.width() + 0)
                var shootSize = 5;

                var cellEl = that.M.area.getCell(user.data.pos.x, user.data.pos.y).el

                var el = $('<div/>')
                            .addClass('shoot')
                            .addClass('shoot_'+user.data.uid)
                            .css('left', cellEl.position().left + userSize/2 - shootSize/2)
                            .css('top', cellEl.position().top + userSize/2 - shootSize/2)
                            .data('x', user.data.pos.x)
                            .data('y', user.data.pos.y)

                $('#area #actions').append(el)

                that.shootStartMove(user, el, direction)

                return false
            }

            that.shootStartMove = function (user, el, direction) {
                var offset = (user.el.width() + 0)

                var moveMap = {
                    'left': {
                        pos: {x:-1, y:0},
                        akvp: ['left','-']
                    },
                    'right': {
                        pos: {x:+1, y:0},
                        akvp: ['left','+']
                    },
                    'up': {
                        pos: {x:0, y:-1},
                        akvp: ['top','-']
                    },
                    'down': {
                        pos: {x:0, y:+1},
                        akvp: ['top','+']
                    },
                }

                var moveOpt = moveMap[direction]

                var _x = parseInt(el.data('x')) + moveOpt.pos.x
                var _y = parseInt(el.data('y')) + moveOpt.pos.y

                var cell = that.M.area.getCell(_x, _y)

                if (cell.type && !cell.type.canmove
                    && that.M.users.getPlayerByPos(_x,_y).isMe != true
                ) {
                    el.fadeOut('fast', function(){$(this).remove()})
                    return
                }

                var isOut = _x <= 0;
                    isOut = isOut || _x > that.M.area.getSize().width;
                    isOut = isOut || _y <= 0;
                    isOut = isOut || _y > that.M.area.getSize().height;

                if (isOut) {
                    el.fadeOut('fast', function(){$(this).remove()})
                    return
                }

                var _animate = {}
                    _animate[moveOpt.akvp[0]] = moveOpt.akvp[1]+'='+offset+'px'

                el.animate(_animate, 'fast', 'linear', function() {
                    el.data('x', _x)
                    el.data('y', _y)

                    // setTimeout(function(){
                        that.shootStartMove(user, el, direction)
                    // }, 100)
                })
            }

            that.getMe = function () {
                return that.getPlayer(that.M.data.me)
            }

            that.getPlayer = function (uid) {
                var el = $('#area #users #player_'+uid)

                return {
                    el: el,
                    data: that.M.data.users && that.M.data.users[uid],
                    isMe: el.hasClass('player_me')
                }
            }

            that.getPlayerByPos = function (x, y) {
                for (var k in that.M.data.users) {
                    var u = that.M.data.users[k]

                    if (u.pos.x == x && u.pos.y == y) {
                        return that.getPlayer(u.uid)
                    }
                }

                return null
            }

            that.exists = function (uid) {
                return 'undefined' !== typeof that.getPlayer(uid).data
            }

            that.getAll = function () {
                return that.M.data.users
            }
        })(that)

        //
        that.area = new (function(Module) {
            var that = this
            
            that.M = Module

            that.init = function() {
                that.M.data.areaArray = that.convertAreaArray()
            }

            that.convertAreaArray = function () {
                if (!that.M.data.area) return []

                var areaSimple = that.unpackArea(that.M.data.area)

                var separator = areaSimple.substr(0,1)
                var area = areaSimple.substr(separator.length).split(separator)

                for (var kx in area) {
                    area[kx] = area[kx].split('')
                }

                return area
            }

            that.unpackArea = function (area) {
                var separator = area.substr(0,1)
                var areaPacked = area.substr(separator.length)

                var _regexp = new RegExp(separator+'(\\w)(\\d+)'+separator, 'g')

                var areaUnpacked = areaPacked.replace(_regexp, function(m,chr,count) {
                    return Array(parseInt(count)+1).join(chr)
                })

                return areaUnpacked
            }

            that.getAreaArray = function () {
                return that.M.data.areaArray
            }

            that.getSize = function () {
                var a = that.M.data.areaArray

                return {
                    width: a[0].length,
                    height: a.length
                }
            }

            that.redraw = function() {
                that.init()

                var area = that.M.data.areaArray

                var area_html = []

                for (var kx in area) {
                    var cells = area[kx]

                    area_html.push('<div class="row">')
                    
                    for (var ky in cells) {
                        var _cell_type = that.getCellType(cells[ky])

                        var _class = 'cell cell_' + _cell_type.type

                        // if (_cell_type.type == 'bomb') {
                        //     _class += ' cell_b1'//+random(1,4);
                        // }

                        area_html.push('<div class="'+_class+'"></div>')
                    }

                    area_html.push('</div>')
                }

                $('#area #table').html(area_html.join(''))
            }

            that.getCellType = function (type) {
                // try to get obj for type with 'small'-name
                if (typeof(that.M.data.cell_types.sf[type]) != 'undefined') {
                    var p = that.M.data.cell_types.sf[type]
                        p.canmove = p.canmove===false ? false : true

                    return p
                }

                // try to get obj for type with 'full'-name
                else {
                    return this.getCellType(that.M.data.cell_types.fs[type])
                }
            }

            that.getCell = function (x, y) {
                var el = $('#area #table')
                    .find('.row').eq(y-1)
                    .find('.cell').eq(x-1)

                var _return = {
                    // data: null,
                    type: null,
                    el: null
                }

                if (el.length == 1 && (x>0&&y>0)) {
                    var cell = that.M.data.areaArray[y-1][x-1]

                    _return.type = that.getCellType(cell)
                    _return.el = el
                }

                return _return
            }

            that.setCell = function (x,y, type) {
                var _type = that.getCellType(type)

                that.M.data.areaArray[y-1][x-1] = _type.stype

                that.getCell(x,y).el.attr('class', 'cell cell_'+_type.type)
            }
        })(that)
    }

    return Module
})