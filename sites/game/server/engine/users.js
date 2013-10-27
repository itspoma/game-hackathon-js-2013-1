var _module = function(M) {
    var that = this

    that.M = M
    that.data = {}

    that.add = function (uid) {
        log.debug('add user:', uid)

        var _hero = that.M.heroes.getRandom()
        var _pos = that.M.area.getFreeCell()

        that.data[uid] = {
            uid: uid,
            name: uid,
            hero: _hero.id,
            pos: _pos
        }
    }

    that.get = function (uid) {
        return that.exists(uid) ? that.data[uid] : {}
    }

    that.getAll = function () {
        return that.data
    }

    that.exists = function (uid) {
        return typeof(that.data[uid]) !== 'undefined'
    }

    that.remove = function (uid) {
        delete that.data[uid]
    }

    that.move = function (uid, direction) {
        var newCoordsFunc = {
            'left': function (x,y) { return {'x':x-1, 'y':y} },
            'right': function (x,y) { return {'x':x+1, 'y':y} },
            'up': function (x,y) { return {'x':x, 'y':y-1} },
            'down': function (x,y) { return {'x':x, 'y':y+1} }
        }

        var player = that.get(uid)

        var oldCoords = {x:player.pos.x, y:player.pos.y}
        var newCoords = newCoordsFunc[direction](oldCoords.x, oldCoords.y)

        that.data[uid].pos.x = newCoords.x
        that.data[uid].pos.y = newCoords.y

        var cell = that.M.area.getCell(newCoords.x, newCoords.y)

        var _return = {
            toX: newCoords.x,
            toY: newCoords.y,
            toCell: cell.type
        }

        if (cell.type == 'bomb'
            || cell.type == 'bonus')
        {
            that.M.area.setCell(newCoords.x, newCoords.y, 'empty')
        }

        return _return
    }
}

module.exports = function(M) {
    return new _module(M);
}