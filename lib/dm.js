/**
 *  DOM manipulations
 */

'use strict';
var util = require('./util')
var is = require('./is')

function Selector(sel) {
    if (util.type(sel) == 'string') {
        var nodes = util.copyArray(document.querySelectorAll(sel))
        return Shell(nodes)
    }
    else if (util.type(sel) == 'array') {
        return Shell(sel)
    }
    else if (sel instanceof Shell) return sel
    else if (is.DOM(sel)) {
        return Shell([sel])
    }
    else {
        throw new Error('Unexpect selector !')
    }
}

function Shell(nodes) {
    if (nodes instanceof Shell) return nodes
    nodes.__proto__ = proto
    return nodes
}

var proto = {
    find: function(sel) {
        var subs = []
        this.forEach(function(n) {
            subs = subs.concat(util.copyArray(n.querySelectorAll(sel)))
        })
        return Shell(subs)
    },
    attr: function(attname, attvalue) {
        var len = arguments.length
        var el = this[0]
        if (len > 1) {
            el.setAttribute(attname, attvalue)
        } else if (len == 1) {
            return (el.getAttribute(attname) || '').toString()
        }
        return this
    },
    removeAttr: function(attname) {
        this.forEach(function(el) {
            el.removeAttribute(attname)
        })
        return this
    },
    addClass: function(clazz) {
        this.forEach(function(el) {
            el.classList.add(clazz)
        })
        return this
    },
    removeClass: function(clazz) {
        this.forEach(function(el) {
            el.classList.remove(clazz)
        })
        return this
    },
    each: function(fn) {
        this.forEach(fn)
        return this
    },
    on: function(type, listener, capture) {
        this.forEach(function(el) {
            el.addEventListener(type, listener, capture)
        })
        return this
    },
    off: function(type, listener) {
        this.forEach(function(el) {
            el.removeEventListener(type, listener)
        })
        return this
    },
    html: function(html) {
        var len = arguments.length
        if (len >= 1) {
            this.forEach(function(el) {
                el.innerHTML = html
            })
        } else if (this.length) {
            return this[0].innerHTML
        }
        return this
    },
    parent: function() {
        if (!this.length) return null
        return Shell([this[0].parentNode])
    },
    remove: function() {
        this.forEach(function(el) {
            var parent = el.parentNode
            parent && parent.removeChild(el)
        })
        return this
    },
    // return element by index
    get: function(i) {
        return this[i]
    },
    append: function(n) {
        if (this.length) this.get(0).appendChild(n)
        return this
    },
    replace: function(n) {
        var tar = this.get(0)
        tar.parentNode.replaceChild(n, tar)
        return this
    }
}
proto.__proto__ = Shell.prototype
proto.__proto__.__proto__ = Array.prototype


module.exports = Selector
