var config = require('./config.js')
  , colors = require('colors')

global.log = function() {
    if (!config.debug) return

    var value = '  ';

    for (var k in arguments) {
        if ('string' === typeof arguments[k]) {
            value += ' ' + arguments[k]
        }
        else {
            console.log(value.yellow.bold, arguments[k])
            value = ''
        }
    }

    console.log(value.yellow.bold)

    // config.debug && console.log.apply(console, arguments)
}

global.random = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}