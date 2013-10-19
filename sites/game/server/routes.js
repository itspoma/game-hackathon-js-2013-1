exports.map = {
    '/': 'index',
    '/game': 'game'
}

//

var swig = require('swig')

var __viewsdir = __dirname + '/views'

//

exports.index = function(req, res){
    res.send(swig.renderFile(__viewsdir+'/index.html'))
}

exports.game = function(req, res){
    res.send(swig.renderFile(__viewsdir+'/game.html'))
}