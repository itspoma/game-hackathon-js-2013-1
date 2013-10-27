require.config({
    baseUrl: 'js/',
    config: {
        app: {
            debug: true
        },
        engine: {
            debug: true
        },
        socket: {
            link: "http://"+window.location.hostname+":9999",
            resource: "s",
        }
    },
    shim: {
        jquery: {
            exports: "$"
        }
    },
    paths: {
        'socket.io': [
            "//"+window.location.hostname+":9999/s/socket.io",
            "//cdn.socket.io/stable/socket.io"
        ],
        'cache': '/js/modules/cache',
        'sound': '/js/modules/sound',
        'events': '/js/modules/events',
        'socket': '/js/modules/socket',
        'jquery': "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min",
        'google-font': "//ajax.googleapis.com/ajax/libs/webfont/1/webfont",
        'keypress': '/js/lib/keypress'
    }
})

define("app", function(require, exports, module) {
    var pages = require("pages")

    var config = module.config()

    console.isDebug = config.debug

    var pageName = document.getElementsByTagName('body')[0].id.replace('page-', '')
    var page = pages[pageName]

    if ('undefined' == typeof page) {
        window.location = '/'
        return
    }

    page.init()
})

;require(["jquery", "google-font", "app"]);

log = function() {
    if (console.isDebug && true) {
        var args = arguments

        for (var k in args) {
            // convert 'string' to 'array' to prevent shit in console
            if (typeof args[k] == 'string' && args[k].length >= 50) {
                args[k] = [args[k]]
            }
        }

        console && console.log.apply(console, args)
    }
}

random = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}