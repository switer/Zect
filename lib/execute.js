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
        arguments[2] = '. {' + arguments[2] + '}' // expr
        // var label = arguments[3]
        // var target = arguments[4]
        switch (e.name) {
            case 'ReferenceError':
                console.warn(e.message + arguments[2])
                break
            default:
                console.error(
                     (arguments[3] ? '\'' + arguments[3] + '\': ' : ''),
                    e.message +
                    arguments[2],
                    arguments[4] || ''
                )
        }
        return ''
    }
}
module.exports = _execute