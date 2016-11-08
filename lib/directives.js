/**
 *  Build-in Global Directives
 */

'use strict';

var $ = require('./dm')
var conf = require('./conf')
var util = require('./util')


module.exports = function() {
    return {
        'attr': {
            multi: true,
            bind: function(attname) {
                this.attrs = attname ? attname.trim().split(/\s+/) : []
                if (this.attrs.length) {
                    this._$el = $(this.$el)
                }
            },
            update: function(next) {
                var that = this
                this.attrs.forEach(function (attname) {
                    if (util.isUndef(next)) {
                        that._$el.removeAttr(attname)
                    } else {
                        that._$el.attr(attname, next)
                    }
                })
            },
            unbind: function () {
                this._$el = this.attname = null
            }
        },
        'class': {
            multi: true,
            bind: function(className) {
                this.classes = className ? className.trim().split(/\s+/) : []
                if (this.classes.length) {
                    this._$el = $(this.$el)
                }
            },
            update: function(isUseClass) {
                var that = this
                this.classes.forEach(function (className) {
                    if (isUseClass) that._$el.addClass(className)
                    else that._$el.removeClass(className)
                })
            },
            unbind: function () {
                this._$el = this.className = null
            }
        },
        'html': {
            update: function (nextHTML) {
                this.$el.innerHTML = nextHTML
            }
        },
        'model': {
            bind: function () {
                var tagName = this.$el.tagName
                var type = tagName.toLowerCase()
                var $el = this._$el = $(this.$el)

                // pick input element type spec
                type = type == 'input' ? $el.attr('type') || 'text' : type

                switch (type) {
                    case 'tel':
                    case 'url':
                    case 'text':
                    case 'search':
                    case 'password':
                    case 'textarea':
                        this.evtType = 'input'
                        break
                    
                    case 'date':
                    case 'week':
                    case 'time':
                    case 'month':
                    case 'datetime':
                    case 'datetime-local':
                    case 'color':
                    case 'range':
                    case 'number':
                    case 'select':
                    case 'checkbox':
                        this.evtType = 'change'
                        break
                    default:
                        console.warn('"' + conf.namespace + 'model" only support input,textarea,select')
                        return
                }

                var vm = this.$vm
                var _update = this.$update
                var vType = type == 'checkbox' ? 'checked':'value'
                var that = this

                /**
                 *  DOM input 2 state
                 */
                this._requestChange = function () {
                    vm.$set(that._prop, that.$el[vType])
                }
                /**
                 *  State 2 DOM input
                 */
                this._update = function () {
                    var nv = vm.$get(that._prop)
                    nv = util.isUndef(nv) ? '' : nv
                    if (that.$el[vType] !== nv) {
                        that.$el[vType] = nv
                    }
                }
                this.$update = function () {
                    that._update()
                    _update && _update.apply(this, arguments)
                }
                $el.on(this.evtType, this._requestChange)
            },
            watch: function (prop) {
                if (this._watches) {
                    this._watches.forEach(function (fn) {
                        fn()
                    })
                    this._watches = []
                }
                if (!prop) return
                var watches = this._watches = []
                var wKeypath = util.normalize(prop)
                while (wKeypath) {
                    watches.push(this.$vm.$watch(wKeypath, this._update))
                    wKeypath = util.digest(wKeypath)
                }
            },
            update: function (prop) {
                this._prop = prop
                this.watch(prop)
                this._update()
            },
            unbind: function () {
                this._$el.off(this.evtType, this._requestChange)
                this._watches.forEach(function (f) {
                    f()
                })
                this._$el = null
                this._requestChange = this._update = noop
            }
        },
        'on': {
            multi: true,
            watch: false,
            bind: function(evtType, handler, expression ) {
                this._expr = expression
                this.type = evtType
                this._$el = $(this.$el)
            },
            update: function (handler) {
                this.off()
                var fn = handler
                if (util.type(fn) !== 'function') 
                    return console.warn('"' + conf.namespace + 'on" only accept function. {' + this._expr + '}')

                this.fn = fn.bind(this.$vm)
                this._$el && this._$el.on(this.type, this.fn, false)

            },
            off: function () {
                if (this.fn) {
                    this._$el && this._$el.off(this.type, this.fn)
                    this.fn = null
                }
            },
            unbind: function() {
                this.off()
                this._$el = this.type = null
            }
        },
        'show': {
            update: function(next) {
                this.$el.style.display = next ? '' : 'none'
            }
        },
        'style': {
            multi: true,
            bind: function (sheet) {
                this.sheet = sheet
            },
            update: function (next) {
                this.$el.style && (this.$el.style[this.sheet] = next)
            },
            unbind: function () {
                this.sheet = null
            }
        },
        'src': {
            bind: function () {
                this._$el = $(this.$el)
            },
            update: function (src) {
                if (util.isNon(src)) {
                    this._$el.removeAttr('src')
                } else {
                    this._$el.attr('src', src)
                }
            },
            unbind: function () {
                this._$el = null
            }
        }
    }
}
function noop () {}