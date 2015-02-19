'use strict';

var $ = require('./dm')

function defaultExpGetter(exp) {
    if (/\:/.exec(exp)) {
        return [exp.split(':')[1].trim(), exp.split(':')[0].trim()]
    } else {
        return [exp.trim()]
    }
}

function _extractVars(t) {
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
    util.objEach(vm, function (v, k) {
        scope[k] = v
    })
    util.objEach(vm.methods, function (f, k) {
        scope[k] = f
    })
    return (with(scope) {
        eval(expression)
    })
}

function _watch(vm, vars, update) {
    if (vars && vars.length) {
        args = new Array(vars.length)
        vm.$data.$watch(function(kp) {
            vars.forEach(function(key, index) {
                if (kp.indexOf(key) === 0) update.apply(null, arguments)
            })
        })
    }
}

function TextDirective(vm, tar, definition) {
    var v = tar.nodeValue
        .replace(/\\{/g, '\uFFF0')
        .replace(/\\}/g, '\uFFF1')

    var exprReg = /\{[\s\S]*?\}/g
    var parts = v.split(exprReg)

    var exprs = v.match(exprReg).
    var cache = new Array(exprs.length)

    exprs.forEach(function(exp, index) {
        // watch change
        var vars = _extractVars(exp)
        function _update () {
            var pv = cache[index]
            var nv = _execute(exp)
            if (util.diff(nv, pv)) {
                // re-render
                cache[index] = nv
                render()
            }
        }
        _watch(vm, vars, _update)
        // initial value
        cache[index] = _execute(exp)
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

/**
 *  name --> express: without {}
 */
function AttributeDirective (vm, tar, name, definition) {
    var expr = name
    var vars = _extractVars(expr)
    var prev

    function _update () {
        var nexv = _execute(exp)
        if (util.diff(nv, pv)) {
            // re-render
            $(tar).removeAttr(prev).attr(nexv)
            prev = nexv
        }
    }
    // initial value
    prev = _execute(expr)
    $(tar).removeAttr(name).attr(prev, '')

    _watch(vm, vars, _update)
}

/**
 *  Standard directive
 */
var _id = 0
function Directive(vm, tar, definition, name, expr) {
    var d = this

    d.tar = tar
    d.vm = vm
    d.mounted = vm.$el
    d.id = _id++

    var bind = definition.bind
    var upda = definition.update
    var prev

    function _update() {
        var nexv = _execute(exp)
        if (util.diff(nexv, prev)) {
            prev = nexv
            upda.apply(d)
        }
    }
    bind.call(d, expr)
    upda.call(d, _execute(expr))
    _watch(vm, _extractVars(expr), _update)
    return d
}


module.exports = Directive
