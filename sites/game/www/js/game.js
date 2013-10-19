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
            that.redraw_area()

            if (that.data.me) {
                $('#area #player_me').remove()

                    var a = $('#area')
                                .find('.row').eq(that.data.me.pos.y-1)
                                .find('.cell').eq(that.data.me.pos.x-1);


                $('#area').append(
                    $('<div/>')
                        .attr('id', 'player_me')
                        .addClass('player')
                        .addClass('hero_'+that.data.me.hero)
                        .css('left', a.position().left)
                        .css('top', a.position().top)
                )
            }

            // for (var uid in that.data.users) {
            //     if (uid == that.data.me.uid) continue;

            //     var u = that.data.users[uid]

            //     $('#area #player_'+uid).remove()
            //     $('#area').append(
            //         $('<div/>')
            //             .attr('id', 'player_'+uid)
            //             .addClass('player')
            //             .addClass('hero_'+u.hero)
            //             .css('left', u.pos.x)
            //             .css('top', u.pos.y)
            //     )
            // }
        }

        that.redraw_area = function () {
            if (!that.data.area) return

            var types_separator = that.data.area.substr(0,1)
            var area = that.data.area.substr(1).split(types_separator)

            var area_html = []

            for (var kx in area) {
                var cells = area[kx].split('')

                area_html.push('<div class="row">')
                
                for (var ky in cells) {
                    area_html.push('<div class="cell cell_'+cells[ky]+'"></div>')
                }

                area_html.push('</div>')
            }

            $('#area').html(area_html.join(''))
        }

        that.bindEvents = function () {

            keypress.combo("left", function() {
                var offset = ($('#player_me').width() + 0) + 'px'
                $('#area #player_me').css({'left':'-='+offset})
                that.sock.message({'event':'move', 'direction':'left'})
            })

            keypress.combo("right", function() {
                var offset = ($('#player_me').width() + 0) + 'px'
                $('#area #player_me').css({'left':'+='+offset})
                that.sock.message({'event':'move', 'direction':'right'})
            })

            keypress.combo("up", function() {
                var offset = ($('#player_me').width() + 0) + 'px'
                $('#area #player_me').css({'top':'-='+offset})
                that.sock.message({'event':'move', 'direction':'up'})
            })

            keypress.combo("down", function() {
                var offset = ($('#player_me').width() + 0) + 'px'
                $('#area #player_me').css({'top':'+='+offset})
                that.sock.message({'event':'move', 'direction':'down'})
            })

            keypress.combo("space", function() {
                Gun.shoot()
                that.sock.message({'event':'shoot'})
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

            events.addListener('socket.event user.shoot', function (message, cb) {
                var userId = message.uid                
                Gun.shoot(userId)
            })
        }
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