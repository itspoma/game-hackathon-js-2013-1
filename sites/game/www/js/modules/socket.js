define(function(require, exports, module){
    var io = require('socket.io')
      , events = require('events');

    var config = module.config();

    /**/
    var Socket = function() {
        var that = this;

        /**/
        that.connect = function () {
            that.socket = io.connect(config.link, {
                resource: config.resource || "socket.io"
            });

            // when the socket connected successfully
            that.socket.on('connect', function () {
                events.dispatch('socket.connect')
            })

            // when the socket is attempting to connect
            that.socket.on('connecting', function () {
                events.dispatch('socket.connecting')
            })

            // when the socket disconnected
            that.socket.on('disconnect', function () {
                events.dispatch('socket.disconnect')
            })

            // when socket fails to establish a connection
            that.socket.on('connect_failed', function () {
                events.dispatch('socket.connect_failed')
            })

            // when an error occurs
            that.socket.on('error', function () {
                events.dispatch('socket.error')
            })

            // when a message sent with socket is received
            that.socket.on('message', function (message, callback) {
                if (typeof message == 'object'
                    && message.hasOwnProperty('event'))
                {
                    var eventName = message.event;
                    events.dispatch('socket.event '+eventName, message, callback)
                }
                else {
                    events.dispatch('socket.message', [message, callback])
                }
            })

            // when socket fails to re-establish a working connection
            that.socket.on('reconnect_failed', function () {
                events.dispatch('socket.reconnect_failed')
            })

            // when socket successfully reconnected
            that.socket.on('reconnect', function () {
                events.dispatch('socket.reconnect')
            })

            // when the socket is attempting to reconnect
            that.socket.on('reconnecting', function () {
                events.dispatch('socket.reconnecting')
            })
        }

        /**/
        that.send = function (name, data) {
            that.socket.emit(name, data)
        }

        /**/
        that.message = function (data) {
            that.send('message', data)
        }
    }

    return Socket
})