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

    var reg = /("|').+?[^\\]\1|\.\w*|\w*:|\b(?:this|true|false|null|undefined|new|typeof|Number|String|Object|Array|Math|Date|JSON)\b|([a-z_]\w*)\(|([a-z_]\w*)/gi
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
    if (vars && vars.length) {
        function _handler (kp) {
            vars.forEach(function(key, index) {
                if (_relative(kp, key)) update.call(null, key, index)
            })
        }
        vm.$watch(_handler)
        return function () {
            vm.$unwatch(_handler)
        }
    }
    return noop
}

function _strip(t) {
    return t.trim().match(/^\{([\s\S]*)\}$/m)[1]
}


function compiler (node) {
    this.$el = node
}
compiler.execute = _execute
compiler.stripExpr = _strip
compiler.extractVars = _extractVars

compiler.inherit = function (Ctor) {
    Ctor.prototype.__proto__ = compiler.prototype
    return function Compiler() {
        this.__proto__ = Ctor.prototype
        Ctor.apply(this, arguments)
    }
}
compiler.prototype.bundle = function () {
    return this.$el
}
compiler.prototype.mount = function (pos, replace) {
    if (replace) {
        $(pos).replace(this.bundle())
    } else {
        pos.parentNode.insertBefore(this.bundle(), pos)
    }
}
compiler.prototype.floor = function () {
    return this.$el
}
compiler.prototype.ceil = function () {
    return this.$el
}
compiler.prototype.destroy = function () {
    // TODO
    $(this.$el).remove()
    this.$el = null
    return this
}
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
    d.vm = vm
    d.id = _did++

    var bind = def.bind
    var unbind = def.unbind
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
            upda && upda.call(d, nexv, p)
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

    // watch variable changes of expression
    if (def.watch !== false && isExpr) {
       var unwatch = _watch(vm, _extractVars(expr), _update)
    }

    d.$destroy = function () {
        unbind && unbind.call(d)
        unwatch && unwatch()
        d.$el = null
        d.vm = null
    }
})


var _eid = 0
compiler.Element = compiler.inherit(function (vm, scope, tar, def, name, expr) {

    var d = this
    var bind = def.bind
    var unbind = def.unbind
    var upda = def.update
    var isExpr = !!_isExpr(expr)
    var prev

    isExpr && (expr = _strip(expr))

    d.id = _eid ++
    d.vm = vm
    d.$el = tar
    d.scope = scope

    var tagHTML = util.tagHTML(tar)
    d.$before = document.createComment(tagHTML[0])
    d.$after = document.createComment(tagHTML[1])
    d.$container = document.createDocumentFragment()

    d.$container.appendChild(d.$before)
    d.$container.appendChild(d.$after)

    d.bundle = function () {
        var $ceil = this.ceil()
        var $floor = this.floor()
        var $con = this.$container
        var that = this

        if (!$con.contains($ceil)) {
            util.domRange($ceil.parentNode, $ceil, $floor)
                .forEach(function(n) {
                    that.$container.appendChild(n)
                })
            $con.insertBefore($ceil, $con.firstChild)
            $con.appendChild($floor)
        }
        return $con
    }
    d.floor = function () {
        return this.$after
    }
    d.ceil = function () {
        return this.$before
    }
    d.destroy = function () {
        this.$container = null
        this.$before = null
        this.$after = null
    }


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
            upda && upda.call(d, nexv, p)
        }
    }

    prev = isExpr ? _exec(expr) : expr

    bind && bind.call(d, prev)
    upda && upda.call(d, prev)

    if (def.watch !== false && isExpr) {
        var unwatch = _watch(vm, _extractVars(expr), _update)
    }

    d.$destroy = function () {
        unbind && unbind.call(d)
        unwatch && unwatch()
        d.$el = null
        d.vm = null
        d.scope = null
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
        unwatches.push(_watch(vm, vars, _update))
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

    this.$destroy = function () {
        unwatches.forEach(function (f) {
            f()
        })
    }
})

compiler.Attribute = function(vm, scope, tar, name, value) {
    
    var _isNameExpr = _isExpr(name)
    var _isValueExpr = _isExpr(value)

    var nexpr = _isNameExpr ? _strip(name) : null
    var vexpr = _isValueExpr ? _strip(value) : null

    var unwatches = []

    function _exec(expr) {
        return _execute(vm, scope, expr)
    }
    function _validName (n) {
        if (n.match(' ')) {
            console.warn('Attribute-name can not contains any white space.')
        }
        return n
    }

    // cache last name/value
    var preName = _isNameExpr ? _exec(nexpr) : name
    var preValue = _isValueExpr ? _exec(vexpr) : value

    tar.setAttribute(_validName(preName), preValue)

    /**
     *  watch attribute name expression variable changes
     */
    if (_isNameExpr) {
        unwatches.push(_watch(vm, _extractVars(name), function() {
            var next = _exec(nexpr)
            if (util.diff(next, preName)) {
                $(tar).removeAttr(preName).attr(_validName(next), preValue)
                preValue = next
            }
        }))
    }
    /**
     *  watch attribute value expression variable changes
     */
    if (_isValueExpr) {
        unwatches.push(_watch(vm, _extractVars(value), function() {
            var next = _exec(vexpr)
            if (util.diff(next, preValue)) {
                $(tar).attr(preName, next)
                preValue = next
            }
        }))
    }

    this.$destroy = function () {
        unwatches.forEach(function (f) {
            f()
        })
    }
}


module.exports = compiler
