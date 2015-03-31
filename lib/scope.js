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
    this.bindings.forEach(function (bd) {
        bd.$update()
    })
    this.children.forEach(function (child) {
        child.$update()
    })
}

module.exports = Scope