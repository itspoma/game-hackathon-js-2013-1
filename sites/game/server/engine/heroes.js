var _module = function(M) {
    var that = this

    that.M = M
    that.data = {}

    that.heroes = {
        'eric_cartman': {
            'id': 'eric_cartman'
        },
        'kyle_broflovski': {
            'id': 'kyle_broflovski'
        },
        'kenny_mccormick': {
            'id': 'kenny_mccormick'
        },
        'leopold_butters_stotch': {
            'id': 'leopold_butters_stotch'
        },
        'tank1': {
            'id': 'tank1'
        }
    }

    that.getRandom = function () {
        var heroesArr = keys(that.heroes)
        return that.heroes[heroesArr[random(0,heroesArr.length-1)]]
    }
}

module.exports = function(M) {
    return new _module(M);
}