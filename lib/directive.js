var $ = require('./dm')
var util = require('./util')

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
 *  Calc expression value
 */
function _execute(vm, extScope, expression, label) {
    extScope = extScope || {}

    var scope = {}
    util.extend(scope, vm.$methods, vm.$data, extScope.methods, extScope.data)
    try {
        var result = eval('with(scope){%s}'.replace('%s', expression))
        return result
    } catch (e) {
        console.error(
            (label ? '"' + label + '": ' : '') + 
            'Execute expression "%s" with error "%s"'.replace('%s', expression).replace('%s', e.message)
        )
        return ''
    }
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

/**
 *  Whether a text is with express syntax
 */
_isExpr = util.isExpr

function _strip(t) {
    return t.trim().match(/^\{(.*?)\}$/)[1]
}
/**
 *  Standard directive
 */
var _id = 0

function Directive(vm, scope, tar, def, name, expr) {
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
    d.mounted = vm.$el
    d.id = _id++
    var mounted = true
    d.mount = function () {
        if (mounted) return
        mounted = true
        def.mount && def.mount.call(d)
    }
    d.unmount = function () {
        if (!mounted) return
        mounted = false
        def.unmount && def.unmount.call(d)
    }
    d.mounted = function () {
        return mounted
    }
    d.container = function () {
        return def.container ? def.container.call(d) : tar
    }

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
    var primary = isExpr ? _exec(expr):expr

    bindParams.push(primary)
    bindParams.push(expr)
    // ([property-name], expression-value, expression) 
    bind && bind.apply(d, bindParams)
    upda && upda.call(d, primary)

    // if expression is expressive and watch option not false, 
    // watch variable changes of expression
    if (isExpr && def.watch !== false) {
        _watch(vm, _extractVars(expr), _update)
    }
}

Directive.Text = function(vm, scope, tar) {

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
}

Directive.Attribute = function(vm, scope, tar, name, value) {

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


module.exports = Directive
