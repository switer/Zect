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
    },
    /**
     *  two level diff
     */
    diff: function (next, pre) {
        var method
        if (this.type(next) == 'array' && this.type(pre) == 'array')
            method = this.arrayDiff
        else if (this.type(next) == 'object' && this.type(pre) == 'object') 
            method = this.objDiff
        else method = this.valueDiff

        return method.call(this, next, pre)
    },
    objDiff: function (next, pre) {
        var nkeys = Object.keys(next)
        var pkeys = Object.keys(pre)
        if (nkeys.length != pkeys.length) return true

        var that = this
        return nkeys.some(function (k) {
            return (!~pkeys.indexOf(k)) || that.valueDiff(next[k], pre[k])
        })
    },
    arrayDiff: function (next, pre) {
        if (next.length !== pre.length) return true
        var that = this
        next.some(function (item, index) {
            return that.valueDiff(item, pre[index])
        })
    },
    valueDiff: function () {
        return next !== pre || next instanceof Object
    }
}