define(function(require, exports, module){
    var cache = require('cache')

    //
    var _module = function() {
        var that = this

        that.nameFileMap = {
            'on-start': 'com_go.wav',
            'on-user-connected': 'nvg_on.wav',
            'on-user-disconnected': 'whizz3.wav',
            'on-user-killed': 'headshot.wav',
            'on-user-me-killed': 'holyshit_ultimate.wav'
        }

        that.play = function (name) {
            var audioFile = that.nameFileMap[name]

            if (typeof(audioFile) == 'undefined') {
                return
            }

            var cacheKey = 'audio '+name
            if (!cache.has(cacheKey)) {
                var audio = new Audio('/audio/'+audioFile)
                cache.set(cacheKey, audio)
            }

            var a = cache.get(cacheKey)
            a.play()
        }
    }

    return new _module
})