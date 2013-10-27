define(function(require, exports, module){
    var jquery = require("jquery")
      , engine = require("engine");

    var p = {
        "welcome": {
            init: function() {
                $('#play').on('click', function() {
                    location = '/game'
                })
            }
        },

        "game": {
            init: function() {
                new engine().init()
            }
        }
    }

    return p
})