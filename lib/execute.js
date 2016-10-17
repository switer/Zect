/**
 *  execute expression from template with specified Scope and ViewModel
 */

var util = require('./util')
var __$compile__ = require('./compile')
var __$compiledExprs___ = {}
/**
 *  Calc expression value
 */
function _execute($vm, $scope/*, expression, [label], [target]*/) {
    /**
     *  $scope is passed when call instance method $compile, 
     *  Each "scope" object maybe include "$parent, data, methods" properties
     */
    // var $parent = $scope && $scope.$parent ? util.extend({}, $scope.$parent.methods, $scope.$parent.data) : {}
    if ($scope && $scope.$parent) {
        $scope.data.$parent = $scope.$parent.data
    }
    var __$expression__ = arguments[2]
    var __$fn__ = __$compiledExprs___[__$expression__]
    $scope = $scope || {}
    $scope = util.extend({}, $vm.$methods, $vm.$data, $scope.methods, $scope.data)
    try {
        if (!__$fn__) {
            __$fn__ = __$compiledExprs___[__$expression__] = __$compile__(__$expression__)
        }
        return util.immutable(__$fn__($scope))
    } catch (e) {
        __$expression__ = /^\{/.test(__$expression__) 
                        ? '. ' + __$expression__
                        : '. {' + __$expression__ + '}' // expr
        // arguments[3] // label
        // arguments[4] // target
        switch (e.name) {
            case 'ReferenceError':
                console.warn(e.message + __$expression__)
                break
            default:
                console.error(
                     (arguments[3] ? '\'' + arguments[3] + '\': ' : ''),
                    e.message + __$expression__,
                    arguments[4] || ''
                )
        }
        return ''
    }
}
module.exports = _execute