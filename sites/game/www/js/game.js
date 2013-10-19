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
                alert('dead')
                // var userId = message.uid                
                // Gun.shoot(userId)
            })
        }

        //
        that.users = new (function(Module) {
            var that = this
            
            that.M = Module

            that.add = function (user) {
                that.M.data.users[user.uid] = user;

                var isMe = that.getMe().data.uid === user.uid
                var cellEl = that.M.area.getCell(user.pos.x, user.pos.y)

                var el = $('<div/>')
                            .attr('id', 'player_'+user.uid)
                            .addClass('player')
                            .addClass(isMe?'player_me':null)
                            .addClass('hero_'+user.hero)
                            .css('left', cellEl.position().left)
                            .css('top', cellEl.position().top)

                $('#area').append(el)
            }

            that.remove = function (user) {
                that.getPlayer(user.uid).el.remove()
            }

            that.redraw = function () {
                for (var uid in that.getAll()) {
                    var isMe = that.getMe().data.uid === uid
                    var player = that.getPlayer(uid)

                    var cellEl = that.M.area.getCell(player.data.pos.x, player.data.pos.y)

                    that.remove(player.data.uid)

                    that.add(player.data)
                }
            }

            that.canMove = function(toX, toY) {
                var area = that.M.area.getAreaArray()

                var areaRow = area[toY-1]
                if (typeof areaRow == 'undefined') {
                    return false
                }

                var areaCell = areaRow[toX-1]
                if (typeof areaCell == 'undefined') {
                    return false
                }

                return (areaCell == 'e') // empty
                    || (areaCell == 'm') // bomb
            }

            that.move = function (who, direction) {
                var timeNow = (new Date()).getTime()

                var player = 'me' === who ? that.getMe() : that.getPlayer(who)

                if ('me' === who && player.data.lastMove) {
                    if (timeNow - player.data.lastMove < 500) {
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
                    el: $('#area #player_'+uid),
                    data: that.M.data.users && that.M.data.users[uid]
                }
            }

            that.getAll = function () {
                return that.M.data.users
            }
        })(that)

        //
        that.area = new (function(Module) {
            var that = this
            
            that.M = Module

            that.redraw = function() {
                var area = that.getAreaArray()

                var area_html = []

                for (var kx in area) {
                    var cells = area[kx]

                    area_html.push('<div class="row">')
                    
                    for (var ky in cells) {
                        var _class = 'cell cell_'+cells[ky];
                        if (cells[ky] == 'b') {
                            _class += ' cell_b'+random(1,4);
                        }
                        area_html.push('<div class="'+_class+'"></div>')
                    }

                    area_html.push('</div>')
                }

                $('#area').html(area_html.join(''))
            }

            that.getAreaArray = function () {
                if (!that.M.data.area) return []

                var types_separator = that.M.data.area.substr(0,1)
                var area = that.M.data.area.substr(1).split(types_separator)

                for (var kx in area) {
                    area[kx] = area[kx].split('')
                }

                return area
            }

            that.getCell = function (x, y) {
                var el = $('#area')
                    .find('.row').eq(y-1)
                    .find('.cell').eq(x-1)

                return el
            }
        })(that)
    }

    Gun = {
        shoot: function(userId){
            var $user
            if(userId === undefined){
                $user = $('#area #player_me')
            }else{
                $user = $('#player_' + userId)
            }
            $bullet = $('<div/>')
                            .addClass('bullet')
            $('#area').append($bullet)
            startPoint = {left: $user.offset().left + ($user.width()/2), top: ($user.offset().top - $bullet.height())}
            $bullet.css('left', startPoint.left).css('top', startPoint.top)
        }
    }



    return Module
})