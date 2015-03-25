/**
 *  Preset Global Directives
 */

'use strict';

var $ = require('./dm')
var conf = require('./conf')
var util = require('./util')
var _relative = util.relative

module.exports = function(Zect) {
    return {
        'attr': {
            multi: true,
            bind: function(attname) {
                this.attname = attname
                this._$el = $(this.$el)
            },
            update: function(next) {
                if (!next && next !== '') {
                    this._$el.removeAttr(this.attname)
                } else {
                    this._$el.attr(this.attname, next)
                }
            }
        },
        'class': {
            multi: true,
            bind: function(className) {
                this.className = className
                this._$el = $(this.$el)
            },
            update: function(next) {
                if (next) this._$el.addClass(this.className)
                else this._$el.removeClass(this.className)
            }
        },
        'html': {
            update: function (nextHTML) {
                this.$el.innerHTML = nextHTML
            }
        },
        'model': {
            bind: function (prop) {
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
                var vType = type == 'checkbox' ? 'checked':'value'
                var that = this

                function _updateDOM() {
                    that.$el[vType] = vm.$get(prop)
                }
                /**
                 *  DOM input 2 state
                 */
                this._requestChange = function () {
                    vm.$set(prop, that.$el[vType])
                }
                /**
                 *  State 2 DOM input
                 */
                this._update = function (kp) {
                    _updateDOM()
                }
                $el.on(this.evtType, this._requestChange)
                _updateDOM()

                var watches = this._watches = []
                var wKeypath = util.normalize(prop)
                while (wKeypath) {
                    watches.push(this.$vm.$watch(wKeypath, this._update))
                    wKeypath = util.digest(wKeypath)
                }
            },
            unbind: function () {
                this._$el.off(this.evtType, this._requestChange)
                this._watches.forEach(function (f) {
                    f()
                })
            }
        },
        'on': {
            multi: true,
            watch: false,
            bind: function(evtType, handler, expression ) {
                var fn = handler
                if (util.type(fn) !== 'function') 
                    return console.warn('"' + conf.namespace + 'on" only accept function. {' + expression + '}')

                this.fn = fn.bind(this.$vm)
                this.type = evtType
                $(this.$el).on(evtType, this.fn, false)
            },
            unbind: function() {
                if (this.fn) {
                    $(this.$el).off(this.type, this.fn)
                    this.fn = null
                }
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
            }
        }
    }
}
