'use strict';

var $ = require('./dm')

function defaultExpGetter(exp) {
    if (/\:/.exec(exp)) {
        return [exp.split(':')[1].trim(), exp.split(':')[0].trim()]
    } else {
        return [exp.trim()]
    }
}

var _id = 0
function Directive(vm, tar, name, definition) {
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