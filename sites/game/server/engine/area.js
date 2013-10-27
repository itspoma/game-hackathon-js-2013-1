var _module = function(M) {
    var that = this

    that.M = M
    that.data = {}

    that.types_separator = ':'
    that.packed_separator = '@'

    that.types = {
        'player': {
            type: 'player',
            type_simple: 'p',
            u_can_move_through: false
        },
        'empty': {
            type: 'empty',
            type_simple: 'e'
        },
        'block': {
            type: 'block',
            type_simple: 'b',
            u_can_move_through: false
        },
        'bomb': {
            type: 'bomb',
            type_simple: 'm'
        },
        'bonus': {
            type: 'bonus',
            type_simple: 'o'
        },
        'bullet': {
            type: 'shot',
            type_simple: 's'
        }
    }

    that.init = function () {
        that.mapName = keys(that.maps)[random(0,keys(that.maps).length-1)]

        log.debug('map: '+that.mapName)

        var mapBuilder = that.maps[that.mapName]
        if (typeof(mapBuilder) == 'string') {
            mapBuilder = that.maps[mapBuilder]
        }

        that.game_area = mapBuilder()
    }

    that.maps = {
        //
        'random': function (o) {
            var area = []

            o = o || {}
            o.perc_blocks = o.perc_blocks || 7
            o.perc_mines = o.perc_mines || 5
            o.perc_bonus = o.perc_bonus || 2

            for (var ix = 0; ix < that.M.config.area.height; ix++) {
                area[ix] = []
                for (var iy = 0; iy < that.M.config.area.width; iy++) {
                    var _type = 'empty'

                    if (random(0,100) <= o.perc_blocks) {
                        _type = 'block'
                    }

                    if (random(0,100) <= o.perc_mines) {
                        _type = 'bomb'
                    }

                    if (random(0,100) <= o.perc_bonus) {
                        _type = 'bonus'
                    }

                    area[ix][iy] = that.types[_type]
                }
            }

            return area
        },

        'random1': function () {
            return that.maps['random']({
                perc_blocks: 10,
                perc_mines: 10,
                perc_bonus: 5
            });
        },

        //
        'poma-map1': function () {
            var area = []

            var _height = that.M.config.area.height
            var _width = that.M.config.area.width

            for (var ix = 0; ix < _height; ix++) {
                area[ix] = []
                for (var iy = 0; iy < _width; iy++) {
                    var _type = 'empty'

                    if (ix == 0
                     || ix == _height-1
                     || iy == 0
                     || iy == _width-1
                     || (iy%2==1 && ix%2==1))
                    {
                        _type = 'bomb'
                    }

                    if (_type=='empty' && random(0,100)>95) {
                        _type = 'bonus'
                    }

                    area[ix][iy] = that.types[_type]
                }
            }

            return area
        }
    }

    // @return {separator}row{sep}row{sep}row{sep}...{sep}row
    that.toSimple = function () {
        var area = []

        for (var kx in that.game_area) {
            var area_row = []

            for (var ky in that.game_area[kx]) {
                area_row.push(that.game_area[kx][ky].type_simple)
            }

            area.push(area_row.join(''))
        }

        var simpleArea = that.types_separator + area.join(that.types_separator)

        return simpleArea
    }

    // @return packet version of map for user
    that.toSimplePacked = function () {
        var simpleArea = that.toSimple()

        var sep = that.packed_separator

        // pack
        for (var k in that.types) {
            var v = that.types[k]

            // bbbb => !b3
            // bbb => bbb
            simpleArea = simpleArea.replace(new RegExp('['+v.type_simple+']{4,}', 'g'), function(m) {
                var m_packed = sep + m.substr(0,1) + m.length + sep
                var isProfitably = m_packed.length < m.length

                if (isProfitably) {
                    return m_packed
                }
                else {
                    return m
                }
            })
        }

        simpleArea = sep + simpleArea

        return simpleArea
    }

    //
    that.getFreeCell = function () {
        var _pos = null

        var _while = 0
        while (!_pos) {
            if (++_while >= 50) break

            var _x = random(0, that.M.config.area.width)
            var _y = random(0, that.M.config.area.height)

            var cell = that.getCell(_x, _y)

            if (cell && 'empty' == cell.type) {
                _pos = {
                    x: _x,
                    y: _y
                }
            }
        }

        return _pos
    }

    //
    that.getCell = function (x,y) {
        if (!that.game_area) {
            return {}
        }

        if (typeof that.game_area[y-1] == 'undefined') {
            return {}
        }

        return that.game_area[y-1][x-1]
    }

    //
    that.setCell = function (x,y, type) {
        that.game_area[y-1][x-1] = that.types[type]
    }

    // @return: {a: {}, b:{}, ..}
    that.getCellTypes = function () {
        // sf : map small <=> full
        // fs : map full <=> full
        var types = {sf:{}, fs:{}}

        for (var k in that.types) {
            var v = that.types[k]

            var _sf_p = {
                stype: v.type_simple,
                type: v.type
            }
            if ((v.u_can_move_through&&true) == false) {
                _sf_p.canmove = false
            }
            
            types.sf[v.type_simple] = _sf_p

            types.fs[v.type] = v.type_simple
        }

        return types
    }
}

module.exports = function(M) {
    return new _module(M);
}