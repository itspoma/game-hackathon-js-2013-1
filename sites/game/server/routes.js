module.exports = function (app) {
    var swig = require('swig')

    var __viewsdir = __dir + '/views'

    app.get('/', function (req, res) {
        res.send(swig.renderFile(__viewsdir+'/index.html'))
    })

    app.get('/ping', function (req, res) {
        res.send('PONG')
    })

    app.get('/game', function (req, res) {
        res.send(swig.renderFile(__viewsdir+'/game.html'))
    })
}