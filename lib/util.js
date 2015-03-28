'use strict';

var Mux = require('./mux')
var _normalize = Mux.keyPath.normalize
var _digest = Mux.keyPath.digest

function _keys(o) {
    return Object.keys(o)
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
    type: function(obj) {
        return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
    },
    copyArray: function(a) {
        var l = a.length
        var n = new Array(l)
        while (l--) {
            n[l] = a[l]
        }
        return n
    },
    copyObject: function(o) {
        var n = {}
        this.objEach(o, function (k, v) {
            n[k] = v
        })
        return n
    },
    objEach: function(obj, fn) {
        if (!obj) return
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if(fn(key, obj[key]) === false) break
            }
        }
    },
    merge: function (src, dest) {
        this.objEach(dest, function (key, value) {
            src[key] = value
        })
        return src
    },
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
    /**
     *  two level diff
     */
    diff: function(next, pre, _t) {
        var that = this
        // defult max 4 level        
        _t = _t == undefined ? 4 : _t

        if (_t <= 0) return next !== pre

        if (this.type(next) == 'array' && this.type(pre) == 'array') {
            if (next.length !== pre.length) return true
            return next.some(function(item, index) {
                return that.diff(item, pre[index], _t - 1)
            })
        } else if (this.type(next) == 'object' && this.type(pre) == 'object') {
            var nkeys = _keys(next)
            var pkeys = _keys(pre)
            if (nkeys.length != pkeys.length) return true

            var that = this
            return nkeys.some(function(k) {
                return (!~pkeys.indexOf(k)) || that.diff(next[k], pre[k], _t - 1)
            })
        }

        return next !== pre
    },
    valueDiff: function(next, pre) {
        return next !== pre || next instanceof Object
    },
    walk: function(node, fn) {
        var into = fn(node) !== false
        var that = this
        if (into) {
            var children = [].slice.call(node.childNodes)
            children.forEach(function (i) {
                that.walk(i, fn)
            })
        }
    },
    insertProto: function (obj, proto) {
        var end = obj.__proto__
        obj.__proto__ = proto
        obj.__proto__.__proto__ = end
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
    normalize: _normalize,
    digest: _digest
}
