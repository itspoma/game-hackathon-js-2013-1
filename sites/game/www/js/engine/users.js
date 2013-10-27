define(function(require, exports, module){
    
    var _module = function(Module) {
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
                if (timeNow - player.data.lastMove < that.M.data.settings.player.move_ps) {
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
            // player.el.rotate({angle: newCoordsP.angle})

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
            var timeNow = (new Date()).getTime()

            var player = 'me' === who ? that.getMe() : that.getPlayer(who)

            if ('me' === who && player.data.lastShoot) {
                if (timeNow - player.data.lastShoot < that.M.data.settings.player.shoot_ps) {
                    return false
                }

                if (that.getShoots(player.data.uid).length >= that.M.data.settings.player.shoot_max_alive) {
                    return false
                }
            }

            // shoot_max_alive

            var userSize = (player.el.width() + 0)
            var shootSize = 5;

            var cellEl = that.M.area.getCell(player.data.pos.x, player.data.pos.y).el

            var el = $('<div/>')
                        .addClass('shoot')
                        .addClass('shoot_'+player.data.uid)
                        .css('left', cellEl.position().left + userSize/2 - shootSize/2)
                        .css('top', cellEl.position().top + userSize/2 - shootSize/2)
                        .data('x', player.data.pos.x)
                        .data('y', player.data.pos.y)

            $('#area #actions').append(el)

            that.M.data.users[that.M.data.me].lastShoot = timeNow

            that.shootStartMove(player, el, direction)

            return true
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
            var cell_user = that.M.users.getPlayerByPos(_x,_y)

            var shootDead = false
                shootDead = cell.type && !cell.type.canmove
                // shootDead = cell_user ? cell_user.isMe != true : shootDead

            var isOut = _x <= 0;
                isOut = isOut || _x > that.M.area.getSize().width;
                isOut = isOut || _y <= 0;
                isOut = isOut || _y > that.M.area.getSize().height;

            if (isOut) shootDead = true

            if (shootDead) {
                if (cell_user && !cell_user.isMe) {
                    events.dispatch('user.kill', cell_user.data.uid)
                }

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

        that.getShoots = function (uid) {
            return $('#area #actions .shoot_'+uid);
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
    }

    return _module
})