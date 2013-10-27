var config = require(__dir+'/config.js')
  , colors = require('colors')

//
global.logLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERR: 3
}

global.log = {
    debug: function() {
        if (config.logLevel > logLevel.DEBUG) return;
        log.toConsole.apply(log.toConsole, arguments)
    },

    info: function() {
        if (config.logLevel > logLevel.INFO) return;
        log.toConsole.apply(log.toConsole, arguments)
    },

    warn: function() {
        if (config.logLevel > logLevel.WARN) return;
        log.toConsole.apply(log.toConsole, arguments)
    },

    err: function() {
        if (config.logLevel > logLevel.ERR) return;
        log.toConsole.apply(log.toConsole, arguments)
    },

    toConsole: function() {
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
    }
}