'use strict';

var $ = require('./dm')
var util = require('./util')
var _execute = require('./execute')
var _relative = util.relative
/**
 *  Whether a text is with express syntax
 */
var _isExpr = util.isExpr
/**
 *  Get varibales of expression
 */
function _extractVars(expr) {
    if (!expr) return null

    var reg = /("|').+?[^\\]\1|\.\w*|\$\w*|\w*:|\b(?:this|true|false|null|undefined|new|typeof|Number|String|Object|Array|Math|Date|JSON)\b|([a-z_]\w*)\(|([a-z_]\w*)/gi
    var vars = expr.match(reg)
    vars = !vars ? [] : vars.filter(function(i) {
        if (!i.match(/^[."']/) && !i.match(/\($/)) {
            return i
        }
    })
    return vars
}

function noop () {}
/**
 *  watch changes of variable-name of keypath
 *  @return <Function> unwatch
 */
function _watch(vm, vars, update) {
    function _handler (kp) {
        var rel = vars.some(function(key, index) {
                if (_relative(kp, key)) {
                    return true
                }
            })
        if (rel) update(kp)
    }
    if (vars && vars.length) {
        vm.$watch(_handler)
        return function () {
            vm.$unwatch(_handler)
        }
    }
    return noop
}

function _strip(t) {
    return t.trim()
            .match(/^\{([\s\S]*)\}$/m)[1]
            .replace(/^- /, '')
}

function _isUnescape(t) {
    return !!t.match(/^\{\- /)
}

/**
 *  Compoiler constructor for wrapping node with consistent API
 *  @node <Node>
 */
function compiler (node) {
    this.$el = node
}
compiler.execute = _execute
compiler.stripExpr = _strip
compiler.extractVars = _extractVars

var cproto = compiler.prototype
compiler.inherit = function (Ctor) {
    Ctor.prototype.__proto__ = cproto
    return function Compiler() {
        this.__proto__ = Ctor.prototype
        Ctor.apply(this, arguments)
    }
}
cproto.$bundle = function () {
    return this.$el
}
cproto.$floor = function () {
    return this.$el
}
cproto.$ceil = function () {
    return this.$el
}
cproto.$mount = function (pos) {
    $(pos).replace(this.$bundle())
    return this
}
cproto.$remove = function () {
    var $el = this.$bundle()
    _parentNode($el) && $($el).remove()
    return this
}
cproto.$appendTo = function (pos) {
    _appendChild(pos, this.$bundle())
    return this
}
cproto.$insertBefore = function (pos) {
    _insertBefore(_parentNode(pos), this.$bundle(), pos)
    return this
}
cproto.$insertAfter = function (pos) {
    _insertBefore(_parentNode(pos), this.$bundle(), _nextSibling(pos))
    return this
}
cproto.$destroy = function () {
    this.$el = null
    return this
}
cproto.$update = function () {}
/**
 *  Standard directive
 */
var _did = 0
var Directive = compiler.Directive = compiler.inherit(function (vm, scope, tar, def, name, expr) {
    var d = this
    var bindParams = []
    var isExpr = !!_isExpr(expr)

    isExpr && (expr = _strip(expr))

    if (def.multi) {
        // extract key and expr from "key: expression" format
        var key 
        expr = expr.replace(/^[^:]+:/, function (m) {
            key = m.replace(/:$/, '').trim()
            return ''
        }).trim()
        
        bindParams.push(key)
    }

    d.$el = tar
    d.$vm = vm
    d.$id = _did++
    d.$scope = scope

    var bind = def.bind
    var unbind = def.unbind
    var upda = def.update
    var prev
    var unwatch


    // set properties
    util.objEach(def, function (k, v) {
        d[k] = v
    })
    
    /**
     *  execute wrap with directive name
     */
    function _exec(expr) {
        return _execute(vm, scope, expr, name)
    }

    /**
     *  update handler
     */
    function _update(kp) {
        var nexv = _exec(expr)
        if (util.diff(nexv, prev)) {
            var p = prev
            prev = nexv
            upda && upda.call(d, nexv, p, kp)
        }
    }

    /**
     *  If expression is a string iteral, use it as value
     */
    prev = isExpr ? _exec(expr):expr
    bindParams.push(prev)
    bindParams.push(expr)
    // watch variable changes of expression
    if (def.watch !== false && isExpr) {
       unwatch = _watch(vm, _extractVars(expr), _update)
    }

    d.$destroy = function () {
        unbind && unbind.call(d)
        unwatch && unwatch()
        d.$el = null
        d.$vm = null
        d.$scope = null
    }
    d.$update = _update

    // ([property-name], expression-value, expression) 
    bind && bind.apply(d, bindParams, expr)
    upda && upda.call(d, prev)

})


var _eid = 0
compiler.Element = compiler.inherit(function (vm, scope, tar, def, name, expr) {
    var d = this
    var bind = def.bind
    var unbind = def.unbind
    var upda = def.update
    var delta = def.delta
    var deltaUpdate = def.deltaUpdate
    var isExpr = !!_isExpr(expr)
    var prev
    var unwatch

    isExpr && (expr = _strip(expr))

    d.$id = _eid ++
    d.$vm = vm
    d.$el = tar
    d.$scope = scope // save the scope reference

    var tagHTML = util.tagHTML(tar)
    d.$before = _createComment(tagHTML[0])
    d.$after = _createComment(tagHTML[1])
    d.$container = document.createDocumentFragment()

    _appendChild(d.$container, d.$before)
    _appendChild(d.$container, d.$after)

    // set properties
    util.objEach(def, function (k, v) {
        d[k] = v
    })

    d.$bundle = function () {
        var $ceil = this.$ceil()
        var $floor = this.$floor()
        var $con = this.$container
        var that = this

        if (!$con.contains($ceil)) {
            util.domRange(_parentNode($ceil), $ceil, $floor)
                .forEach(function(n) {
                    _appendChild(that.$container, n)
                })
            _insertBefore($con, $ceil, $con.firstChild)
            _appendChild($con, $floor)
        }
        return $con
    }
    d.$floor = function () {
        return this.$after
    }
    d.$ceil = function () {
        return this.$before
    }

    d.$destroy = function () {
        unbind && unbind.call(d)
        unwatch && unwatch()
        d.$el = null
        d.$vm = null
        d.$scope = null
    }
    /**
     *  update handler
     */
    function _update(kp) {
        var nexv = _exec(expr)
        if (delta && delta.call(d, nexv, prev, kp)) {
            return deltaUpdate && deltaUpdate.call(d, nexv, p, kp)
        }
        if (util.diff(nexv, prev)) {
            var p = prev
            prev = nexv
            upda && upda.call(d, nexv, p, kp)
        }
    }

    d.$update = _update

    /**
     *  execute wrap with directive name
     */
    function _exec(expr) {
        return _execute(vm, scope, expr, name)
    }

    prev = isExpr ? _exec(expr) : expr
    if (def.watch !== false && isExpr) {
        unwatch = _watch(vm, _extractVars(expr), _update)
    }
    bind && bind.call(d, prev, expr)
    upda && upda.call(d, prev)
})


compiler.Text = compiler.inherit(function(vm, scope, tar, originExpr, parts, exprs) {
    function _exec (expr) {
        return _execute(vm, scope, expr, null)
    }
    var cache = new Array(exprs.length)
    var isUnescape = exprs.some(function (expr) {
        return _isUnescape(expr)
    })
    var unwatches = []

    exprs.forEach(function(exp, index) {
        // watch change
        exp = _strip(exp)
        var vars = _extractVars(exp)

        function _update() {
            var pv = cache[index]
            var nv = _exec(exp)

            if (util.diff(nv, pv)) {
                // re-render
                cache[index] = nv
                render()
            }
        }
        // initial value
        cache[index] = _exec(exp)

        unwatches.push(_watch(vm, vars, _update))
    })

    if (isUnescape) {
        var $tmp = document.createElement('div')
        var $con = document.createDocumentFragment()
        var $before = _createComment('{' + _strip(originExpr))
        var $after = _createComment('}')

        var pn = _parentNode(tar)
        _insertBefore(pn, $before, tar)
        _insertBefore(pn, $after, _nextSibling(tar))
    }

    function render() {
        var frags = []
        parts.forEach(function(item, index) {
            frags.push(item)
            if (index < exprs.length) {
                frags.push(cache[index])
            }
        })

        var nodeV = frags.join('')
                         .replace(/\uFFF0/g, '\\{')
                         .replace(/\uFFF1/g, '\\}')

        if (isUnescape) {
            var cursor = _nextSibling($before)
            while(cursor && cursor !== $after) {
                var next = _nextSibling(cursor)
                _parentNode(cursor).removeChild(cursor)
                cursor = next
            }
            $tmp.innerHTML = nodeV
            ;[].slice.call($tmp.childNodes).forEach(function (n) {
                _appendChild($con, n)
            }) 
            _insertBefore(_parentNode($after), $con, $after)
        } else {
            tar.nodeValue = nodeV
        }
    }

    this.$destroy = function () {
        unwatches.forEach(function (f) {
            f()
        })
    }

    this.$update = function () {
        var hasDiff
        exprs.forEach(function(exp, index) {
            exp = _strip(exp)
            var pv = cache[index]
            var nv = _exec(exp)

            if (!hasDiff && util.diff(nv, pv)) {
                hasDiff = true
            }
            cache[index] = nv
        })
        hasDiff && render()
    }

    /**
     *  initial render
     */
    render()
})

compiler.Attribute = function(vm, scope, tar, name, value) {
    
    var isNameExpr = _isExpr(name)
    var isValueExpr = _isExpr(value)

    var nexpr = isNameExpr ? _strip(name) : null
    var vexpr = isValueExpr ? _strip(value) : null

    var unwatches = []

    function _exec(expr) {
        return _execute(vm, scope, expr, name + '=' + value)
    }
    // validate atrribute name, from: http://www.w3.org/TR/REC-xml/#NT-NameChar
    // /^(:|[a-zA-Z0-9]|_|-|[\uC0-\uD6]|[\uD8-\uF6]|[\uF8-\u2FF]|[\u370-\u37D]|[\u37F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\u10000-\uEFFFF])+$/

    // cache last name/value
    var preName = isNameExpr ? _exec(nexpr) : name
    var preValue = isValueExpr ? _exec(vexpr) : value

    tar.setAttribute(preName, preValue)

    function _updateName() {
        var next = _exec(nexpr)

        if (util.diff(next, preName)) {
            $(tar).removeAttr(preName)
                  .attr(next, preValue)
            preValue = next
        }
    }
    function _updateValue() {
        var next = _exec(vexpr)
        if (util.diff(next, preValue)) {
            $(tar).attr(preName, next)
            preValue = next
        }
    }


    this.$destroy = function () {
        unwatches.forEach(function (f) {
            f()
        })
    }

    this.$update = function () {
        isNameExpr && _updateName()
        isValueExpr && _updateValue()
    }
    /**
     *  watch attribute name expression variable changes
     */
    if (isNameExpr) {
        unwatches.push(_watch(vm, _extractVars(name), _updateName))
    }
    /**
     *  watch attribute value expression variable changes
     */
    if (isValueExpr) {
        unwatches.push(_watch(vm, _extractVars(value), _updateValue))
    }

}

function _appendChild (con, child) {
    return con.appendChild(child)
}
function _createComment (ns) {
    return document.createComment(ns)
}
function _insertBefore (con, child, pos) {
    return con.insertBefore(child, pos)
}
function _parentNode (tar) {
    return tar.parentNode
}
function _nextSibling (tar) {
    return tar.nextSibling
}


module.exports = compiler
