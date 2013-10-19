require.config({
    baseUrl: 'js/',
    config: {
        app: {
            debug: true
        },
        game: {
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
        'jquery': "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min",
        'google-font': "//ajax.googleapis.com/ajax/libs/webfont/1/webfont",
        'keypress': '/js/lib/keypress'
    }
})

define("app", function(require, exports, module) {
    var pages = require("pages");

    var config = module.config()

    console.isDebug = config.debug

    var pageName = document.getElementsByTagName('body')[0].id.replace('page-', '')
    var page = pages[pageName];

    if ('undefined' == typeof page) {
        window.location = '/'
        return
    }

    page.init()
});

require(["jquery", "google-font"]);

log = function() {
    (console.isDebug && true) && (console && console.log.apply(console, arguments))
}

random = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}