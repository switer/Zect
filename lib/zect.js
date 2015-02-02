var $ = require('./dom')
var Mux = require('./mux')
var util = require('./util')
var conf = require('./conf')
/**
 *  private vars
 */
var _getPresetDirective = require('./directive')
var _globalDirectives = {}

/**
 *  Global API
 */
function Zect(options) {
    return ViewModel.call(this, options || {})
}
Zect.extend = function(options) {
    return function() {
        _insertProto(this, Zect.prototype)
        return ViewModel.call(this, options || {})
    }
}
Zect.directive = function(id, definition) {
    _globalDirectives[id] = definition
}
Zect.namespace = function(n) {
    conf.namespace = n
}


function ViewModel (options) {
    var proto = this.__proto__
    var vm = this
    var el = options.el

    if (!el && options.template) {
        el = document.createElement('div')
        el.innerHTML = options.template
    } else if (util.type(el) == 'string') {
        el = document.querySelector(el)
    } else if (!(el instanceof HTMLElement)) {
        throw new Error('Unmatch el option')
    }
    vm.$el = el

    var $data = new Mux({
        deep: true,
        props: options.data,
        computed: options.computed
    })
    Object.defineProperty(vm, '$data', {
        enumerable: true,
        get: function() {
            return $data
        },
        set: function(v) {
            $data.$set(v)
        }
    })
    util.objEach(_getPresetDirective(Zect), function (id, def) {
        registerDirective(vm, id, def)
    })
    util.objEach(_globalDirectives, function (id, def) {
        registerDirective(vm, id, def)
    })

    var ready = options.ready
    ready && ready.call(vm)
}


var _dirId = 0

function registerDirective(vm, id, definition) {
    var attrName = conf.namespace + id
    function defaultExpGetter(exp) {
        if (/\:/.exec(exp)) {
            return [exp.split(':')[1].trim(), exp.split(':')[0].trim()]
        } else {
            return [exp.trim()]
        }
    }

    function directiveParse(tar) {
        var directive = {
            tar: tar,
            vm:vm,
            mounted: vm.$el,
            id: _dirId
        }
        var exp = $(tar).attr(attrName)
        var expGetter = definition.exp
        var bind = definition.bind
        var update = definition.update

        /**
         *  remove declare syntax from element
         */
        $(tar).removeAttr(attrName)
        
        var watches = bind.apply(directive, (expGetter || defaultExpGetter)(exp) || [])
        if (watches) {
            var args = new Array(watches.length)
            vm.$data.$watch(function (kp) {
                watches.forEach(function (key, index) {
                    if (kp.indexOf(key) === 0) {
                        args[index] = vm.$data.$get(key)
                        update.apply(directive, args)
                    }
                })
            })
            // take params initially
            watches.forEach(function (key, index) {
                args[index] = vm.$data.$get(key)
                update.apply(directive, args)
            })
        }
    }
    /**
     *  using selector to parse declare syntax
     */
    vm.$el.hasAttribute(attrName) && directiveParse(vm.$el)

    $(vm.$el).find('[' + attrName + ']').each(function (tar) {
        if(!vm.$el.contains(tar)) return
        directiveParse(tar)
    })
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