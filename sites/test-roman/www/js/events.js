define(function(require, exports, module){
    
    var Module = function() {
        var that = this;

        this.events = {};

        /**/
        this.addListener = function (eventName, callback) {
            if (typeof eventName == 'object') {
                for (var k in eventName) {
                    that.addListener(eventName[k], callback);
                }
                return
            }

            if (!that.events.hasOwnProperty(eventName)) {
                that.events[eventName] = []
            }

            log("add event: "+eventName)
            that.events[eventName].push(callback)

            return that
        }

        /**/
        this.hasListener = function (eventName) {
            if (that.events.hasOwnProperty(eventName)) {
                return true
            }

            return false
        }

        /**/
        this.removeEvent = function (eventName, callback) {
            if (!that.hasListener(eventName)) {
                // throw 'Event "'+eventName+'" not exists';
                return;
            }

            log("remove event: "+eventName)

            delete that.events[eventName]

            return that
        }

        /**/
        this.removeListener = function (eventName, callback) {
            if (!that.hasListener(eventName)) {
                // throw 'Event "'+eventName+'" not exists';
                return;
            }

            log("remove event callback: "+eventName)

            var _eventFuncs = that.events[eventName];

            for (var _i in _eventFuncs) {
                if (_eventFuncs[_i] === callback) {
                    that.events[eventName].splice(_i, 1);
                }
            }

            return that
        }

        /**/
        this.dispatch = function (eventName, data) {
            if (!that.hasListener(eventName)) {
                // throw 'Event "'+eventName+'" not exists';
                log("dispatch event NOT: "+eventName+" ...", data)
                return;
            }

            log("dispatch event: "+eventName)

            var _eventFuncs = that.events[eventName];

            for (var _i in _eventFuncs) {
                _eventFuncs[_i](data);
            }

            return that
        }
    }

    return new Module
})