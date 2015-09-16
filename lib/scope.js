/**
 *  Scope abstraction is a colletor when compiler child template with scope 
 */

'use strict';

function Scope (data, parent) {
    this.data = data
    this.bindings = []
    this.children = []
    this.$parent = parent || {}
}

Scope.prototype.$update = function () {
    var args = arguments
    this.bindings.forEach(function (bd) {
        bd.$update.apply(bd, args)
    })
    this.children.forEach(function (child) {
        child.$update.apply(child, args)
    })
}

module.exports = Scope