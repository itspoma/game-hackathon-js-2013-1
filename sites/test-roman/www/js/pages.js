define(function(require, exports, module){
    var jquery = require("jquery")
      , game = require("game");

    var p = {
        //@todo: move to /js/pages/welcome.js
        "welcome": {
            init: function() {
                $('#play').on('click', function() {
                    location = '/game'
                })
            }
        },

        //@todo: move to /js/pages/game.js
        "game": {
            init: function() {
                new game().init()
            }
        }
    }

    return p
})