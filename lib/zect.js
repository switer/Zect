var $ = require('./dm')
var Mux = require('./mux')
var util = require('./util')
var conf = require('./conf')
var Directive = require('./directive')

/**
 *  private vars
 */
var preset = require('./preset') // preset directives getter
var directives = [null, {}] // [preset, global]
var gdirs = directives[1]
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
    gdirs[id] = definition
}
Zect.namespace = function(n) {
    conf.namespace = n
}


function ViewModel(options) {
    var proto = this.__proto__
    var vm = this
    var el = options.el

    /**
     *  Mounted element detect
     */
    if (!el && options.template) {
        el = document.createElement('div')
        el.innerHTML = options.template
    } else if (util.type(el) == 'string') {
        el = document.querySelector(el)
    } else if (!(el instanceof HTMLElement)) {
        throw new Error('Unmatch el option')
    }
    vm.$el = el

    /**
     *  assign methods
     */
    var methods = options.methods
    util.objEach(methods, function (k, v) {
        vm[k] = v
    })

    var $data
    if (options.$data) {
        $data = options.$data
    } else {
        /**
         *  Init state model
         */
        var mopts = {
            deep: true,
            props: options.data,
            computed: options.computed
        }
        var $data = new Mux(mopts)
    }
    Object.defineProperty(vm, '$data', {
        enumerable: true,
        get: function() {
            return $data
        },
        set: function(v) {
            $data.$set(v)
        }
    })

    /**
     *  Directive bindings
     */
    directives[0] = preset(Zect) // set preset directives

    directives.forEach(function (d) {
        util.objEach(d, function(id, def) {
            parseDirective(vm, id, def)
        })
    })

    /**
     *  Life cycle methods
     */
    options.ready && options.ready.call(vm)
}


function parseDirective(vm, id, definition) {
    var atn = conf.namespace + id
    /**
     *  using selector to parse declare syntax
     */
    vm.$el.hasAttribute(atn) && new Directive(vm, vm.$el, atn, definition)

    $(vm.$el).find('[' + atn + ']').each(function(tar) {
        if (!vm.$el.contains(tar)) return
        new Directive(vm, tar, atn, definition)
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