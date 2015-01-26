var Mux = require('./mux')
var util = require('./util')
var $ = require('./dom')

/**
 *  private vars
 */
var _defaultDirective = require('./directive')
var _globalDirectives = {}
var _localDirectives = {}

var _namespace = 'z-'

function Zect(options) {
    return Component.call(this, options || {})
}

Zect.extend = function(options) {
    return function() {
        _insertProto(this, Zect.prototype)
        return Component.call(this, options || {})
    }
}
Zect.directive = function(id, definition) {
    _globalDirectives[id] = definition
}
Zect.namespace = function(n) {
    _namespace = n + '-'
}

function Component(options) {
    var proto = this.__proto__
    var component = this
    var el = options.el

    if (!el && options.template) {
        el = document.createElement('div')
        el.innerHTML = options.template
    } else if (util.type(el) == 'string') {
        el = document.querySelector(el)
    } else if (!(el instanceof HTMLElement)) {
        throw new Error('Unmatch el option')
    }

    component.$el = el

    var vm = new Mux({
        deep: true,
        props: options.data,
        computed: options.computed
    })

    Object.defineProperty(component, '$data', {
        enumerable: true,
        get: function() {
            return vm
        },
        set: function(v) {
            vm.$set(v)
        }
    })

    util.objEach(_defaultDirective, directiveBinding)

    function directiveBinding(id, definition) {
        var attrName = _namespace + id

        function defaultExpGetter(exp) {
            if (/\:/.exec(exp)) {
                return [exp.split(':')[1].trim(), exp.split(':')[0].trim()]
            } else {
                return [exp.trim()]
            }
        }

        /**
         *  using selector to parse declare syntax
         */
        $(component.$el).find('[' + attrName + ']').each(function(tar) {
            var directive = {
                tar: tar,
                mounted: component.$el,
                vm: vm
            }
            var exp = $(tar).attr(attrName)
            var expGetter = definition.exp
            var bind = definition.bind
            var update = definition.update

            var watchKeys = bind.apply(directive, (expGetter || defaultExpGetter)(exp) || [])

            if (watchKeys) {
                var args = new Array(watchKeys.length)
                watchKeys.forEach(function(key, index) {
                    args[index] = vm.$get(key)
                    vm.$watch(key, function(next) {
                        args[index] = next
                        update.apply(directive, args)
                    })
                    update.apply(directive, args)
                })
            }
            /**
             *  remove declare syntax from element
             */
            $(tar).removeAttr(attrName)
        })
    }

}


/**
 *  utils
 */
function _insertProto(obj, proto) {
    var end = obj.__proto__
    obj.__proto__ = proto
    obj.__proto__.__proto__ = end
}


module.exports = Zect
