'use strict';

var util = require('./util')

function _copy(arr) {
    if (!arr) return []
    var l = arr.length
    var n = new Array(l)
    while(l) {
        n[l] = arr[--l]
    }
    return n
}
function Selector (sel) {
    if (util.type()) {
        
    }
    var nodes = _copy(document.querySelectorAll(sel))
    return Dom(nodes)
}

function Dom (nodes) {
    return {
        find: function (el) {
            var subs = []
            nodes.forEach(function (n) {
                subs = subs.concat(_copy(n.querySelectorAll(el)))
            })
            return Dom(subs)
        },
        attr: function (attname, attvalue) {
            var len = arguments.length
            var el = nodes[0]
            if (len > 1) {
                el.setAttribute(attname, attvalue)
            } else if (len == 1) {
                return (el.getAttribute(attname) || '').toString()
            }
            return this
        },
        addClass: function (clazz) {
            nodes.forEach(function (el) {
                var classes = _copy(el.classList)
                if (!~classes.indexOf(clazz)) classes.push(clazz)
                el.className = classes.join(' ')
            })
            return this
        },
        removeClass: function (clazz) {
            nodes.forEach(function (el) {
                el.className = classes.reduce(function (r, n) {
                    if (n != clazz) r.push(n)
                    return r
                }, []).join(' ')
            })
            return this
        },
        each: function (fn) {
            nodes.forEach(fn)
            return this
        }
    }
}

function Collection () {

}

module.exports = Selector