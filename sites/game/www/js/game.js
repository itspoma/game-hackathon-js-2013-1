define(function(require, exports, module){
    var jquery = require('jquery')
      , events = require('events')
      , socket = require('socket')
      , tmp1 = require('keypress')

    var Module = function(config) {
        var that = this

        that.config = module.config()
        that.data = {}

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

                    log('game set "'+k+'" = "'+v+'"')
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
                if (this.users.shoot()) {
                    that.sock.message({'event':'shoot'})
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
                that.M.area.setCell(player.data.pos.x, player.data.pos.y, 'e')
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
                var cell = that.M.area.getCell(toX, toY).data

                return (cell == 'e') // empty
                    || (cell == 'm') // bomb
                    || (cell == 'o') // bonus
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

                var newCoordsFunc = {
                    'left': function (x,y) { return {'x':x-1, 'y':y} },
                    'right': function (x,y) { return {'x':x+1, 'y':y} },
                    'up': function (x,y) { return {'x':x, 'y':y-1} },
                    'down': function (x,y) { return {'x':x, 'y':y+1} }
                }

                var oldCoords = {x:player.data.pos.x, y:player.data.pos.y}
                var newCoords = newCoordsFunc[direction](oldCoords.x, oldCoords.y)

                if (true !== that.canMove(newCoords.x, newCoords.y)) {
                    return false
                }

                player.el.attr('direction', direction)

                that.M.area.setCell(oldCoords.x, oldCoords.y, 'e')
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

            that.getMe = function () {
                return that.getPlayer(that.M.data.me)
            }

            that.getPlayer = function (uid) {
                return {
                    el: $('#area #users #player_'+uid),
                    data: that.M.data.users && that.M.data.users[uid]
                }
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

            that.redraw = function() {
                that.init()

                var area = that.M.data.areaArray

                var area_html = []

                for (var kx in area) {
                    var cells = area[kx]

                    area_html.push('<div class="row">')
                    
                    for (var ky in cells) {
                        var _class = 'cell cell_'+cells[ky];
                        if (cells[ky] == 'b') {
                            _class += ' cell_b1'//+random(1,4);
                        }
                        area_html.push('<div class="'+_class+'"></div>')
                    }

                    area_html.push('</div>')
                }

                $('#area #table').html(area_html.join(''))
            }

            that.getCell = function (x, y) {
                var el = $('#area #table')
                    .find('.row').eq(y-1)
                    .find('.cell').eq(x-1)

                return {
                    data: that.M.data.areaArray[y-1][x-1],
                    el: el
                }
            }

            that.setCell = function (x,y, type) {
                that.M.data.areaArray[y-1][x-1] = type

                that.getCell(x,y).el.attr('class', 'cell cell_'+type)
            }
        })(that)
    }

    Gun = {
        shoot: function(userId){
            var $user
            if(userId === undefined){
                $user = $('#area #users #player_me')
            }else{
                $user = $('#player_' + userId)
            }
            $bullet = $('<div/>')
                            .addClass('bullet')
            $('#area #table').append($bullet)
            startPoint = {left: $user.offset().left + ($user.width()/2), top: ($user.offset().top - $bullet.height())}
            $bullet.css('left', startPoint.left).css('top', startPoint.top)
        }
    }



    return Module
})