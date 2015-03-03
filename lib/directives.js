/**
 *  Preset Global Directives
 */

'use strict';

var $ = require('./dm')
var conf = require('./conf')
var util = require('./util')

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
        'on': {
            multi: true,
            watch: false,
            bind: function(evtType, handler /*, expression*/ ) {
                var fn = handler
                if (util.type(fn) !== 'function') return console.warn('"' + conf.namespace + 'on" only accept function')
                this.fn = fn.bind(this.vm)
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
