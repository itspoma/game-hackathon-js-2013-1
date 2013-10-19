// r.js -o r.build.js
// ./node_modules/requirejs/bin/r.js -o www/r.build.js
({
    baseUrl: "js/",
    // mainConfigFile

    include: ['../app', 'game', 'pages'],
    // name: "package",
    out: "app.min.js",
    
    optimize: 'uglify',
    uglify: {
        beautify: true,
        max_line_length: 1000
    },

    preserveLicenseComments: false,
    fileExclusionRegExp: /\.git/,

    paths: {
        'socket.io': "empty:"
      , 'jquery': 'empty:'
      , 'google-font': 'empty:'
      , 'keypress': 'empty:'
    }
})