var $ = require('./dm')
var util = require('./util')

function _extractVars(t) {
    if (!t) return null

    var reg = /("|').+?[^\\]\1|\.\w*|\w*:|\b(?:this|true|false|null|undefined|new|typeof|Number|String|Object|Array|Math|Date|JSON)\b|([a-z_]\w*)/gi
    var vars = t.match(reg)
    vars = !vars ? [] : vars.filter(function(i) {
        if (!i.match(/^[."']/)) {
            return i
        }
    })
    return vars
}

/**
 *  Calc expression value
 */
function _execute(vm, expression) {
    var scope = {}
    util.objEach(vm.$data, function(k, v) {
        scope[k] = v
    })
    util.objEach(vm.$methods, function(k, f) {
        scope[k] = f
    })
    return eval('with(scope){%s}'.replace('%s', expression))
}

function _watch(vm, vars, update) {
    if (vars && vars.length) {
        vm.$data.$watch(function(kp) {
            vars.forEach(function(key, index) {
                if (kp.indexOf(key) === 0) update.call(null, key, index)
            })
        })
    }
}

/**
 *  Whether a text is with express syntax
 */
function _isExpr(c) {
    return c ? c.trim().match(/^\{.*?\}$/) : false
}

function _strip(t) {
    return t.trim().match(/^\{(.*?)\}$/)[1]
}
/**
 *  Standard directive
 */
var _id = 0

function Directive(vm, tar, definition, name, expr) {

    var d = this
    var multiSep = ','

    var bindParams = []

    if (definition.multi) {
        if (expr.match(multiSep)) {
            var parts = expr.split(multiSep)
            return parts.map(function (item) {
                return new Directive(vm, tar, definition, name, item)
            })
        }
        // do with single
        var exprFrag = expr.split(':')
        bindParams.push(exprFrag[0].trim())
        expr = exprFrag[1].trim()
    }

    d.tar = tar
    d.vm = vm
    d.mounted = vm.$el
    d.id = _id++

    var bind = definition.bind
    var upda = definition.update
    var prev

    function _update() {
        var nexv = _execute(vm, expr)
        if (util.diff(nexv, prev)) {
            var p = prev
            prev = nexv
            upda.call(d, nexv, p)
        }
    }

    var primary = _execute(vm, expr)
    bindParams.push(primary)
    bindParams.push(expr)
    bind && bind.apply(d, bindParams)
    upda && upda.call(d, primary)

    if (definition.watch !== false) {
        _watch(vm, _extractVars(expr), _update)
    }
}

Directive.Text = function(vm, tar) {
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
            var nv = _execute(vm, exp)
            if (util.diff(nv, pv)) {
                // re-render
                cache[index] = nv
                render()
            }
        }
        _watch(vm, vars, _update)
        // initial value
        cache[index] = _execute(vm, exp)
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
}

Directive.Attribute = function(vm, tar, name, value) {
    var nvars = _isExpr(name) ? _extractVars(expr) : null
    var vvars = _isExpr(value) ? _extractVars(expr) : null

    var nexpr = nvars ? _strip(name) : null
    var vexpr = nvars ? _strip(value) : null

    var attName = nvars ? _execute(vm, nexpr) : name
    var attValue = nvars ? _execute(vm, vexpr) : value

    tar.setAttribute(attName, attValue)

    _watch(vm, vvars, function() {
        var next = _execute(vm, vexpr)
        if (util.diff(next, attValue)) {
            $(tar).attr(attName)
            attValue = next
        }
    })
    _watch(vm, nvars, function() {
        var next = _execute(vm, nexpr)
        if (util.diff(next, attValue)) {
            $(tar).removeAttr(attValue).attr(next, attValue)
            attValue = next
        }
    })
}


module.exports = Directive
