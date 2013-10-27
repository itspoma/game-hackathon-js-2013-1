define(function(require, exports, module){
    //
    var _module = function() {
        var that = this

        that.data = {}

        //
        that.has = function (key) {
            return typeof(that.data[key]) !== 'undefined'
        }

        //
        that.set = function (key, value) {
            that.data[key] = value
        }

        //
        that.get = function (key) {
            return that.data[key]
        }
    }

    return new _module
})