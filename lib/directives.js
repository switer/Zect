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
            },
            update: function(next) {
                if (!next && next !== '') {
                    $(this.$el).removeAttr(this.attname)
                } else {
                    $(this.$el).attr(this.attname, next)
                }
            }
        },
        'class': {
            multi: true,
            bind: function(className) {
                this.className = className
            },
            update: function(next) {
                var $el = $(this.$el)
                if (next) $el.addClass(this.className)
                else $el.removeClass(this.className)
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
                var cedit = this.$el.hasAttribute('contenteditable')
                var type = cedit ? 'contenteditable' : tagName.toLowerCase()

                switch (type) {
                    case 'input':
                        this.evtType = 'input'
                        break
                    case 'textarea':
                        this.evtType = 'input'
                        break
                    case 'select':
                        this.evtType = 'change'
                        break
                    case 'contenteditable':
                        this.evtType = 'input'
                        break
                    default:
                        console.warn('"' + conf.namespace + 'model" only support input,textarea,select,contenteditable')
                        return
                }

                var vm = this.$vm
                var that = this

                function _updateDOM() {
                    if (cedit) {
                        that.$el.innerHTML = vm.$get(prop)
                    } else {
                        that.$el.value = vm.$get(prop)
                    }
                }

                function _updateState() {
                    if (cedit) {
                        vm.$set(prop, that.$el.innerHTML)
                    } else {
                        vm.$set(prop, that.$el.value)
                    }
                }
                /**
                 *  DOM input 2 state
                 */
                this._requestChange = _updateState
                /**
                 *  State 2 DOM input
                 */
                this._update = function (kp) {
                    if (_relative(kp, prop)) {
                        _updateDOM()
                    }
                }

                $(this.$el).on(this.evtType, this._requestChange)

                _updateDOM()
                this.$vm.$data.$watch(this._update)
            },
            unbind: function () {
                $(this.$el).off(this.evtType, this._requestChange)
                this.$vm.$data.$unwatch(this._update)
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
                this.$el.addEventListener(evtType, this.fn, false)
            },
            unbind: function() {
                if (this.fn) {
                    this.$el.removeEventLisnter(this.type, this.fn)
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
