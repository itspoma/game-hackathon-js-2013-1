//
global.keys = function (v) {
    var keys = [];

    for(var i in v) if (v.hasOwnProperty(i)) {
        keys.push(i);
    }

    return keys;
}