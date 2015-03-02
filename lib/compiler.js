'use strict';

var $ = require('./dm')
var util = require('./util')
var _execute = require('./execute')
/**
 *  Whether a text is with express syntax
 */
var _isExpr = util.isExpr
/**
 *  Get varibales of expression
 */
function _extractVars(expr) {
    if (!expr) return null

    var reg = /("|').+?[^\\]\1|\.\w*|\w*:|\b(?:this|true|false|null|undefined|new|typeof|Number|String|Object|Array|Math|Date|JSON)\b|([a-z_]\w*)/gi
    var vars = expr.match(reg)
    vars = !vars ? [] : vars.filter(function(i) {
        if (!i.match(/^[."']/)) {
            return i
        }
    })
    return vars
}

/**
 *  watch changes of variable-name of keypath
 */
function _watch(vm, vars, update) {
    if (vars && vars.length) {
        vm.$data.$watch(function(kp) {
            vars.forEach(function(key, index) {
                if (kp.indexOf(key) === 0) update.call(null, key, index)
            })
        })
    }
}

function _strip(t) {
    return t.trim().match(/^\{(.*?)\}$/)[1]
}


function compiler (node) {
    this.tar = node
}
compiler.execute = _execute

compiler.inherit = function (Ctor) {
    Ctor.prototype.__proto__ = compiler.prototype
    return function Compiler() {
        this.__proto__ = Ctor.prototype
        Ctor.apply(this, arguments)
    }
}
compiler.prototype.root = function () {
    return this.tar
}
compiler.prototype.pack = function () {
    return this.root()
}
compiler.prototype.mount = function (pos, replace) {
    if (replace) {
        $(pos).replace(this.pack())
    } else {
        pos.parentNode.insertBefore(this.pack(), pos)
    }
}
compiler.prototype.floor = function () {
    return this.root()
}
compiler.prototype.ceil = function () {
    return this.root()
}
compiler.prototype.destroy = function () {
    // TODO
    return this
}
/**
 *  Standard directive
 */
var _did = 0
compiler.Directive = compiler.inherit(function (vm, scope, tar, def, name, expr) {
    var d = this
    var bindParams = []
    var isExpr = !!_isExpr(expr)

    isExpr && (expr = _strip(expr))
    if (def.multi) {
        var multiSep = ','
        if (expr.match(multiSep)) {
            var parts = expr.split(multiSep)
            return parts.map(function(item) {
                return new Directive(vm, tar, def, name, item)
            })
        }
        // do with single
        var propertyName 
        expr = expr.replace(/^[^:]+:/, function (m) {
            propertyName = m.replace(/:$/, '').trim()
            return ''
        }).trim()

        bindParams.push(propertyName)
    }

    d.tar = tar
    d.vm = vm
    d.id = _did++

    var bind = def.bind
    var upda = def.update
    var prev
    /**
     *  execute wrap with directive name
     */
    function _exec(expr) {
        return _execute(vm, scope, expr, name)
    }

    /**
     *  update handler
     */
    function _update() {
        var nexv = _exec(expr)
        if (util.diff(nexv, prev)) {
            var p = prev
            prev = nexv
            upda.call(d, nexv, p)
        }
    }

    /**
     *  If expression is a string iteral, use it as value
     */
    prev = isExpr ? _exec(expr):expr

    bindParams.push(prev)
    bindParams.push(expr)
    // ([property-name], expression-value, expression) 
    bind && bind.apply(d, bindParams)
    upda && upda.call(d, prev)

    // if expression is expressive and watch option not false, 
    // watch variable changes of expression
    if (isExpr && def.watch !== false) {
        _watch(vm, _extractVars(expr), _update)
    }
})


var _eid = 0
compiler.Element = compiler.inherit(function (vm, scope, tar, def, name, expr) {

    var d = this
    var bind = def.bind
    var upda = def.update
    var isExpr = !!_isExpr(expr)
    var prev
    
    d.id = _eid ++
    d.vm = vm
    d.tar = tar
    d.scope = scope
    d.$before = document.createComment(name + '-{' + expr + '}-before')
    d.$after = document.createComment(name + '-{' + expr + '}-after')
    d.$container = document.createDocumentFragment()

    d.$container.appendChild(d.$before)
    d.$container.appendChild(d.$after)
    /**
     *  execute wrap with directive name
     */
    function _exec(expr) {
        return _execute(vm, scope, expr, name)
    }

    ;['mount', 'pack', 'root', 'floor', 'destroy'].forEach(function (prop) {
        if (def.hasOwnProperty(prop)) {
            d[prop] = def[prop]
        }
    })

    /**
     *  update handler
     */
    function _update() {
        var nexv = _exec(expr)
        console.log(util.diff(nexv, prev))
        if (util.diff(nexv, prev)) {
            var p = prev
            prev = nexv
            console.log('---------upda')
            upda.call(d, nexv, p)
        }
    }

    prev = isExpr ? _exec(expr):expr

    bind && bind.call(d, prev)
    upda && upda.call(d, prev)

    if (isExpr && def.watch !== false) {
        _watch(vm, _extractVars(expr), _update)
    }
})


compiler.Text = compiler.inherit(function(vm, scope, tar) {

    function _exec (expr) {
        return _execute(vm, scope, expr)
    }
    var v = tar.nodeValue
        .replace(/\\{/g, '\uFFF0')
        .replace(/\\}/g, '\uFFF1')

    var exprReg = /\{[\s\S]*?\}/g
    var parts = v.split(exprReg)

    var exprs = v.match(exprReg)
        // expression not match
    if (!exprs || !exprs.length) return

    var cache = new Array(exprs.length)

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
        _watch(vm, vars, _update)
        // initial value
        cache[index] = _exec(exp)
    })

    function render() {
        var frags = []
        parts.forEach(function(item, index) {
            frags.push(item)
            if (index < exprs.length) {
                frags.push(cache[index])
            }
        })
        tar.nodeValue = frags.join('')
            .replace(/\uFFF0/g, '\\{')
            .replace(/\uFFF1/g, '\\}')
    }
    /**
     *  initial render
     */
    render()
})

compiler.Attribute = function(vm, scope, tar, name, value) {

    function _exec(expr) {
        return _execute(vm, scope, expr)
    }

    var _ifNameExpr = _isExpr(name)
    var _ifValueExpr = _isExpr(value)

    var nexpr = _ifNameExpr ? _strip(name) : null
    var vexpr = _ifValueExpr ? _strip(value) : null

    var preName = _ifNameExpr ? _exec(nexpr) : name
    var preValue = _ifValueExpr ? _exec(vexpr) : value

    function _validName (n) {
        if (n.match(' ')) {
            console.error('Attribute-name can not contains any white space.')
        }
        return n
    }

    tar.setAttribute(_validName(preName), preValue)

    /**
     *  watch attribute name expression variable changes
     */
    _ifNameExpr && _watch(vm, _extractVars(name), function() {
        var next = _exec(nexpr)
        if (util.diff(next, preName)) {
            $(tar).removeAttr(preName).attr(_validName(next), preValue)
            preValue = next
        }
    })
    /**
     *  watch attribute value expression variable changes
     */
    _ifValueExpr && _watch(vm, _extractVars(value), function() {
        var next = _exec(vexpr)
        if (util.diff(next, preValue)) {
            $(tar).attr(preName, next)
            preValue = next
        }
    })
}


module.exports = compiler
