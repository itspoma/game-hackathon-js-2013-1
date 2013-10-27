({
    baseUrl: "js/",

    include: ['pages', 'engine', '../app'],
    out: "app.min.js",

    optimize: 'uglify',
    uglify: {
        beautify: false,
        max_line_length: 1000
    },

    preserveLicenseComments: false,
    fileExclusionRegExp: /\.git/,

    paths: {
        'socket.io': "empty:"
      , 'jquery': 'empty:'
      , 'google-font': 'empty:'
      , 'keypress': 'empty:'
      , 'events': 'empty:'
      , 'socket': 'empty:'
      , 'cache': 'empty:'
      , 'sound': 'empty:'
    }
})