define(function(require, exports, module){
    var jquery = require('jquery')
      , events = require('events')
      , socket = require('socket')
      , tmp1 = require("keypress")

    var Module = function(config) {
        var that = this

        that.config = module.config()
        that.data = {}

        that.init = function () {
            log('game init')

            that.preloadResources()
            that.bindEvents()
            that.redraw()

            that.start()
        }

        this.preloadResources = function () {
            //
        }

        that.start = function () {
            log('game start')

            that.sock = new socket()
            that.sock.connect()
        }

        that.redraw = function () {
            $('#area').width(that.data['area.width'])
            $('#area').height(that.data['area.height'])

            if (that.data.me) {
                $('#area #player_me').remove()
                $('#area').append(
                    $('<div/>')
                        .attr('id', 'player_me')
                        .addClass('player')
                        .addClass('hero_'+that.data.me.hero)
                        .css('left', that.data.me.pos.x)
                        .css('top', that.data.me.pos.y)
                )
            }

            for (var uid in that.data.users) {
                if (uid == that.data.me.uid) continue;

                var u = that.data.users[uid]
                console.log(u)
                $('#area #player_'+uid).remove()
                $('#area').append(
                    $('<div/>')
                        .attr('id', 'player_'+uid)
                        .addClass('player')
                        .addClass('hero_'+u.hero)
                        .css('left', u.pos.x)
                        .css('top', u.pos.y)
                )
            }
        }

        that.bindEvents = function () {


            var offset = '60px'

            keypress.combo("left", function() {
                $('#area #player_me').css({'left':'-='+offset})
                that.sock.message({'event':'move', 'direction':'left'})
            })

            keypress.combo("right", function() {
                $('#area #player_me').css({'left':'+='+offset})
                that.sock.message({'event':'move', 'direction':'right'})
            })

            keypress.combo("up", function() {
                $('#area #player_me').css({'top':'-='+offset})
                that.sock.message({'event':'move', 'direction':'up'})
            })

            keypress.combo("down", function() {
                $('#area #player_me').css({'top':'+='+offset})
                that.sock.message({'event':'move', 'direction':'down'})
            })


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

                that.redraw()
            })

            // user.connected
            events.addListener('socket.event user.connected', function (message, cb) {
                var user = message.user

                var el = $('<div/>')
                            .attr('id', 'player_'+user.uid)
                            .addClass('player')
                            .addClass('hero_'+user.hero)
                            .css('left', user.pos.x)
                            .css('top', user.pos.y)

                $('#area').append(el)
            })

            // user.disconnected
            events.addListener('socket.event user.disconnected', function (message, cb) {
                var user = message.user

                $('div#player_'+user.uid).remove()
            })

            // user.move
            events.addListener('socket.event user.move', function (message, cb) {
                var user = message.uid
                var direction = message.direction

                var userEl = $('#player_'+user)

                if ('left' == direction) {
                    userEl.css({'left':'-='+offset})
                }
                else if ('right' == direction) {
                    userEl.css({'left':'+='+offset})
                }
                else if ('up' == direction) {
                    userEl.css({'top':'-='+offset})
                }
                else if ('down' == direction) {
                    userEl.css({'top':'+='+offset})
                }
            })
        }
    }

    return Module
})