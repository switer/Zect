var util = require('./util')

/**
 *  Calc expression value
 */
function _execute(vm, extScope, expression, label) {
    extScope = extScope || {}

    var scope = {}
    var result = ''
    util.extend(scope, vm.$methods, vm.$data, extScope.methods, extScope.data)
    try {
        var result = util.immutable(eval('with(scope){%s}'.replace('%s', expression)))
    } catch (e) {
        console.error(
            (label ? '"' + label + '": ' : '') + 
            'Execute expression "%s" with error "%s"'.replace('%s', expression).replace('%s', e.message)
        )
    }
    return result
}
module.exports = _execute