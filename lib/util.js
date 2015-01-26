'use strict';


module.exports = {
    type: function (obj) {
        return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
    },
    copyArray: function (arr) {
        var len = arr.length
        var nArr = new Array(len)
        while(len --) {
            nArr[len] = arr[len]
        }
        return nArr
    },
    objEach: function (obj, fn) {
        if (!obj) return
        for(var key in obj) {
            if (obj.hasOwnProperty(key)) {
                fn(key, obj[key])
            }
        }
    }
}