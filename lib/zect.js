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
     *  Init state model
     */
    var mopts = {
        deep: true,
        props: options.data,
        computed: options.computed
    }

    /**
     *  Use for sharing EventEmitter with childVM
     */
    if (options.emitter) mopts.emitter = options.emitter
    var $data = new Mux(mopts)
    Object.defineProperty(vm, '$data', {
        enumerable: true,
        get: function() {
            return $data
        },
        set: function(v) {
            $data.$set(v)
        }
    })
    Object.defineProperty(vm, '$emitter', {
        enumerable: false,
        get: function() {
            return $data.$emitter
        },
        set: function() {
            throw new Error('Can not overwrite $emitter property')
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
    var attrName = conf.namespace + id


    /**
     *  using selector to parse declare syntax
     */
    vm.$el.hasAttribute(attrName) && new Directive(vm, vm.$el, attrName, definition)

    $(vm.$el).find('[' + attrName + ']').each(function(tar) {
        if (!vm.$el.contains(tar)) return
        new Directive(vm, tar, attrName, definition)
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