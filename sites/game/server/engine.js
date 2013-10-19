var M = function() {
    var that = this

    that.init = function(config, ev) {
        log('engine init')
        
        that.config = config
        that.ev = ev

        that.bindEvents()
    }

    that.bindEvents = function() {
        that.ev.on('socket.connected', function (id, socket) {
            if (true !== that.users.exists(id)) {
                log(id)

                that.users.add(id)

                log(that.users.getAll())

                socket.json.send({'event':'set', 'params':{
                    'area.width': that.config.area.width,
                    'area.height': that.config.area.height,
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
}

module.exports = new M



// game.users = new (function() {
//     var that = this

//     that.users = {}

//     that.add = function(uid, params) {
//         params.name = random(0,100)
//         that.users[uid] = params
//     }

//     that.set = function(uid, params) {
//         for (var k in that.users) {
//             if (params.hasOwnProperty(k)) {
//                 that.users[uid][k] = params[k]
//             }
//         }
//     }

//     that.remove = function(uid) {
//         delete that.users[uid]
//     }

//     that.get = function(uid) {
//         return that.users[uid]
//     }

//     that.getAll = function() {
//         return that.users
//     }

//     that.getCount = function() {
//         var i = 0
//         for (var uid in that.users) {
//             i++
//         }
//         return i
//     }
// })

// module.exports = game