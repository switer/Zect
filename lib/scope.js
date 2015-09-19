/**
 *  Scope abstraction is a colletor when compiler child template with scope 
 */

'use strict';

function Scope (data, parent) {
    this.data = data
    this.bindings = []
    this.children = []
    this.$parent = parent || null
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
Scope.prototype.$removeChild = function (scope) {
    var i = this.children.indexOf(scope)
    if (~i) {
        scope.$parent = null
        this.children.splice(i, 1)
    }
    return this
}
Scope.prototype.$addChild = function (scope) {
    if (!~this.children.indexOf(scope)) this.children.push(scope)
    return this
}

module.exports = Scope