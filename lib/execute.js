var util = require('./util')

/**
 *  Calc expression value
 */
function _execute($vm, $scope/*, expression, _label*/) {
    var $parent = $scope && $scope.$parent ? util.extend({}, $scope.$parent.methods, $scope.$parent.data) : {}
    
    $scope = $scope || {}
    $scope = util.extend({}, $vm.$methods, $vm.$data, $scope.methods, $scope.data)

    try {
        return util.immutable(eval('with($scope){(%s)}'.replace('%s', arguments[2])))
    } catch (e) {
        console.error(
            (arguments[3] ? '"' + arguments[3] + '": ' : '') + 
            'Execute {%s} with error "%s"'.replace('%s', arguments[2]).replace('%s', e.message)
        )
        return ''
    }
}
module.exports = _execute