define(function(require, exports, module){
    
    var _module = function(Module) {
        var that = this
        
        that.M = Module

        that.init = function() {
            that.M.data.areaArray = that.convertAreaArray()
        }

        that.convertAreaArray = function () {
            if (!that.M.data.area) return []

            var areaSimple = that.unpackArea(that.M.data.area)

            var separator = areaSimple.substr(0,1)
            var area = areaSimple.substr(separator.length).split(separator)

            for (var kx in area) {
                area[kx] = area[kx].split('')
            }

            return area
        }

        that.unpackArea = function (area) {
            var separator = area.substr(0,1)
            var areaPacked = area.substr(separator.length)

            var _regexp = new RegExp(separator+'(\\w)(\\d+)'+separator, 'g')

            var areaUnpacked = areaPacked.replace(_regexp, function(m,chr,count) {
                return Array(parseInt(count)+1).join(chr)
            })

            return areaUnpacked
        }

        that.getAreaArray = function () {
            return that.M.data.areaArray
        }

        that.getSize = function () {
            var a = that.M.data.areaArray

            return {
                width: a[0].length,
                height: a.length
            }
        }

        that.redraw = function() {
            that.init()

            $('body').attr('area', that.M.data.area_name)
            $('#area').attr('name', that.M.data.area_name)

            var area = that.M.data.areaArray

            var area_html = []

            for (var kx in area) {
                var cells = area[kx]

                area_html.push('<div class="row">')
                
                for (var ky in cells) {
                    var _cell_type = that.getCellType(cells[ky])

                    var _class = 'cell cell_' + _cell_type.type

                    // if (_cell_type.type == 'bomb') {
                    //     _class += ' cell_b1'//+random(1,4);
                    // }

                    area_html.push('<div class="'+_class+'"></div>')
                }

                area_html.push('</div>')
            }

            $('#area #table').html(area_html.join(''))
        }

        that.getCellType = function (type) {
            // try to get obj for type with 'small'-name
            if (typeof(that.M.data.cell_types.sf[type]) != 'undefined') {
                var p = that.M.data.cell_types.sf[type]
                    p.canmove = p.canmove===false ? false : true

                return p
            }

            // try to get obj for type with 'full'-name
            else {
                return this.getCellType(that.M.data.cell_types.fs[type])
            }
        }

        that.getCell = function (x, y) {
            var el = $('#area #table')
                .find('.row').eq(y-1)
                .find('.cell').eq(x-1)

            var _return = {
                // data: null,
                type: null,
                el: null
            }

            if (el.length == 1 && (x>0&&y>0)) {
                var cell = that.M.data.areaArray[y-1][x-1]

                _return.type = that.getCellType(cell)
                _return.el = el
            }

            return _return
        }

        that.setCell = function (x,y, type) {
            var _type = that.getCellType(type)

            that.M.data.areaArray[y-1][x-1] = _type.stype

            that.getCell(x,y).el.attr('class', 'cell cell_'+_type.type)
        }
    }

    return _module
})