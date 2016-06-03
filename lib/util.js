'use strict';

var Mux = require('muxjs')
var mUtils = Mux.utils
var _normalize = Mux.keyPath.normalize
var _digest = Mux.keyPath.digest

function _keys(o) {
    return Object.keys(o)
}
function _forEach (items, fn) {
    var len = items.length || 0
    for (var i = 0; i < len; i ++) {
        if(fn(items[i], i)) break
    }
}
function _slice (obj) {
    if (!obj) return []
    return [].slice.call(obj)
}
var escapeCharMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    '\'': '&#x27;',
    '/': '&#x2F;'
}
var escapeRex = new RegExp(_keys(escapeCharMap).join('|'), 'g')
module.exports = {
    type: mUtils.type,
    diff: mUtils.diff,
    merge: mUtils.merge,
    objEach: mUtils.objEach,
    copyArray: mUtils.copyArray,
    copyObject: mUtils.copyObject,
    
    extend: function(obj) {
        if (this.type(obj) != 'object') return obj;
        var source, prop;
        for (var i = 1, length = arguments.length; i < length; i++) {
            source = arguments[i];
            for (prop in source) {
                obj[prop] = source[prop];
            }
        }
        return obj;
    },
    valueDiff: function(next, pre) {
        return next !== pre || next instanceof Object
    },
    walk: function(node, fn) {
        var into = fn(node) !== false
        var that = this
        if (into) {
            _slice(node.childNodes).forEach(function (node) {
                that.walk(node, fn)
            })
        }
    },
    domRange: function (tar, before, after) {
        var children = []
        var nodes = tar.childNodes
        var start = false
        for (var i = 0; i < nodes.length; i++) {
            var item = nodes[i]
            if (item === after) break
            else if (start) {
                children.push(item)
            } else if (item == before) {
                start = true
            }
        }
        return children
    },
    immutable: function (obj) {
        var that = this
        var _t = this.type(obj)
        var n

        if (_t == 'array') {
            n = obj.map(function (item) {
                return that.immutable(item)
            })
        } else if (_t == 'object') {
            n = {}
            this.objEach(obj, function (k, v) {
                n[k] = that.immutable(v)
            })
        } else {
            n = obj
        }
        return n
    },
    tagHTML: function (tag) {
        var h = tag.outerHTML
        var open = h.match(/^<[^>]+?>/)
        var close = h.match(/<\/[^<]+?>$/)
        
        return [open ? open[0]:'', close ? close[0]:'']
    },
    relative: function (src, dest) {
        src = _normalize(src)
        dest = _normalize(dest)

        if (src == dest) return true
        else {
            var start = src.indexOf(dest) === 0
            var subkp = src.replace(dest, '').match(/^[\.\[]/)
            return start && subkp
        }
    },
    escape: function (str) {
        if (!this.type(str) == 'string') return str
        return str.replace(escapeRex, function (m) {
            return escapeCharMap[m]
        })
    },
    isUndef: function (o) {
        return o === void(0)
    },
    isNon: function (o) {
        var t = this.type(o)
        return t === 'undefined' || t === 'null'
    },
    bind: function (fn, ctx) {
        var dummy = function () {
            return fn.apply(ctx, arguments)
        }
        dummy.toString = function () {
            return fn.toString.apply(fn, arguments)
        }
        return dummy
    },
    forEach: _forEach,
    normalize: _normalize,
    digest: _digest
}
