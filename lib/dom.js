'use strict';

var util = require('./util')

function Selector (sel) {
    if (util.type(sel) == 'string') {
        var nodes = util.copyArray(document.querySelectorAll(sel))
        return Dom(nodes)
    } else if (sel instanceof Dom) return sel
    else if (sel instanceof HTMLElement) {
        return Dom([sel])
    } else {
        throw new Error('Unexpect selector !')
    }
}

function Dom (nodes) {
    var ins = {
        find: function (sel) {
            var subs = []
            nodes.forEach(function (n) {
                subs = subs.concat(util.copyArray(n.querySelectorAll(sel)))
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
        removeAttr: function (attname) {
            nodes.forEach(function (el) {
                el.removeAttribute(attname)
            })
            return this
        },
        addClass: function (clazz) {
            nodes.forEach(function (el) {
                var classes = util.copyArray(el.classList)
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
        },
        on: function (type, listener, capture) {
            nodes.forEach(function (el) {
                el.addEventListener(type, listener, capture)
            })
            return this
        },
        off: function (type, listener) {
            nodes.forEach(function (el) {
                el.removeEventListener(type, listener)
            })
            return this
        },
        html: function (html) {
            var len = arguments.length
            if (len >= 1) {
                nodes.forEach(function (el) {
                    el.innerHTML = html
                })
            } else if (nodes.length){
                return nodes[0].innerHTML
            }
            return this
        },
        parent: function () {
            if (!nodes.length) return null
            return Dom([nodes[0].parentNode])
        },
        remove: function () {
            nodes.forEach(function (el) {
                var parent = el.parentNode
                parent && parent.removeChild(el)
            })
            return this
        },
        // return element by index
        get: function (i) {
            return nodes[i]
        },
        append: function (n) {
            if (nodes.length) this.get(0).appendChild(n)
            return this
        }
    }
    ins.__proto__ = Dom.prototype
    return ins
}

module.exports = Selector