var Mux = require('./mux')
var $ = require('./dom')

function Zect(options) {
    return Component.call(this)
}
Zect.extend = function(options) {
    return function() {
        _insertProto(this, Zect.prototype)
        return Component.call(this)
    }
}

function Component(options) {
    var component = this
    var proto = this.__proto__
    var el = options.el,

    if (!el && options.template) {
        el = document.createElement('div')
        el.innerHTML = options.template
    } else if (_type(el) == 'string') {
        el = document.querySelector(el)
    } else if (!(el instanceof HTMLElement)) {
        throw new Error('Unmatch el option')
    }

    this.$el = el

    var vm = new Mux({
        props: options.data,
        computed: options.computed
    })

    Object.defineProperty(component, '$data', {
        enumerable: true,
        get: function () {
            return vm
        },
        set: function (v) {
            vm.$set(v)
        }
    })
}

function binding (el, vm) {
    $(el).find('[z-html]').each(function(el) {
        var $el = $(el)
        var depName = $el.attr('z-html').toString()

        function update(next) {
            $el.html(next)
        }
        vm.$watch(depName, update)
        update(vm.$get(depName))
        removeDeclare($el, 'z-html')
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

function _type() {
    return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
}

module.exports = Zect
