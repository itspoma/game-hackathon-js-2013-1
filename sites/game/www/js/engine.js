define(function(require, exports, module){
    var jquery = require('jquery')
      , events = require('events')
      , socket = require('socket')
      , sound = require('sound')
      , e_users = require('engine/users')
      , e_area = require('engine/area')
      , tmp1 = require('keypress')

    var Module = function(config) {
        var that = this

        that.config = module.config()
        that.data = {}

        that.config.debug && (window.engine = that)

        that.init = function () {
            log('game init')

            that.users = new e_users(that)
            that.area = new e_area(that)

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

                sound.play('on-start')
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
                sound.play('on-user-connected')

                that.users.add(message.user)
            })

            // user.disconnected
            events.addListener('socket.event user.disconnected', function (message, cb) {
                sound.play('on-user-disconnected')

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
                var _direction = that.users.getMe().el.attr('direction') || 'up'

                if (true == that.users.shoot('me', _direction)) {
                    that.sock.message({'event':'shoot', 'direction':_direction})
                }
            })

            // on shoot
            events.addListener('user.kill', function (uid) {
                that.sock.message({'event':'user.kill', 'uid':uid})
            })

            //
            events.addListener('socket.event user.kill', function (message, cb) {
                var killer = message.killer
                var killed = message.killed

                var isKilledMe = that.users.getMe().data.uid === killed

                if (isKilledMe) {
                    sound.play('on-user-me-killed')

                    setTimeout(function(){
                        location.reload()
                    }, 2000)
                }
                else {
                    sound.play('on-user-killed')
                }
            })

            // on shoot
            events.addListener('socket.event user.shoot', function (message, cb) {
                var uid = message.uid
                var direction = message.direction

                that.users.shoot(uid, direction)
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
    }

    return Module
})