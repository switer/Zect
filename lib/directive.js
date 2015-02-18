'use strict';

var $ = require('./dm')

function defaultExpGetter(exp) {
    if (/\:/.exec(exp)) {
        return [exp.split(':')[1].trim(), exp.split(':')[0].trim()]
    } else {
        return [exp.trim()]
    }
}

function TextDirective(vm, tar, definition) {
    var v = c.nodeValue
                .replace(/\\{/g, '\uFFF0')
                .replace(/\\}/g, '\uFFF1')

    var exprReg = /\{[\s\S]*?\}/g
    var parts = v.split(exprReg)
    var cache = new Array(exprs.length)
    var varsReg = /("|').+?[^\\]\1|\.\w*|\w*:|\b(?:this|true|false|null|undefined|new|typeof|Number|String|Object|Array|Math|Date|JSON)\b|([a-z_]\w*)/gi

    var exprs = v.match(exprReg).map(function (exp) {
        var vars = exp.match(varsReg)
        vars = !vars 
                ? [] 
                : vars.filter(function (i) {
                    if (!i.match(/^[."']/)) {
                        return i
                    }
                })
        
    })

    function render() {
        parts.forEach(function () {

        })
    }
}

function AttrDirective() {

}

var _id = 0
function Directive(vm, tar, desc, definition) {
    var d = this
    d.tar = tar
    d.vm = vm
    d.mounted = vm.$el
    d.id = _id ++

    var exp = $(tar).attr(name) // Attr String
    var expression = definition.exp || defaultExpGetter // Function
    var bind = definition.bind
    var update = definition.update

    /**
     *  remove declare syntax from element
     */
    $(tar).removeAttr(name)

    var watches = bind.apply(d, expression(exp) || [])
    var args
    function _update(key, index) {
        args[index] = vm.$data.$get(key)
        update.apply(d, args)
    }

    if (watches && watches.length) {
        args = new Array(watches.length)
        vm.$data.$watch(function(kp) {
            watches.forEach(function(key, index) {
                if (kp.indexOf(key) === 0) _update.apply(null, arguments)
            })
        })

        // take params initially
        watches.forEach(_update)
    }

    return d
}


module.exports = Directive