var util = require('./util')

/**
 *  Calc expression value
 */
function _execute($vm, $scope/*, expression, [label], [target]*/) {
    /**
     *  $scope is passed when call instance method $compile, 
     *  Each "scope" object maybe include "$parent, data, method" properties
     */
    var $parent = $scope && $scope.$parent ? util.extend({}, $scope.$parent.methods, $scope.$parent.data) : {}
    
    $scope = $scope || {}
    $scope = util.extend({}, $vm.$methods, $vm.$data, $scope.methods, $scope.data)

    try {
        return util.immutable(eval('with($scope){(%s)}'.replace('%s', arguments[2])))
    } catch (e) {
        var expr = '. {' + arguments[2] + '}'
        var label = arguments[3]
        var target = arguments[4]
        switch (e.name) {
            case 'ReferenceError':
                console.warn(e.message + expr)
                break
            default:
                console.error(
                     (label ? '\'' + label + '\': ' : ''),
                    e.message +
                    expr,
                    target || ''
                )
        }
        return ''
    }
}
module.exports = _execute