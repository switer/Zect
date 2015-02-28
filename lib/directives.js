/**
 *  Preset Global Directives
 */

'use strict';

var $ = require('./dm')
var conf = require('./conf')
var util = require('./util')

module.exports = function(Zect) {
    return {
        'if': {
            bind: function(cnd, expr) {
                this.holder = document.createComment(conf.namespace + 'if-{' + expr +'}')
                this.mount = function () {
                    $(this.holder).replace(this.tar)
                }
                this.unmount = function () {
                    $(this.tar).replace(this.holder)
                }
                this.unmount()
            },
            // next: true show || false unmount
            update: function(next, pre) {
                if (!next) {
                    this.unmount()
                } else if (this.compiled) {
                    this.mount()
                } else {
                    this.compiled = true
                    this.vm.$compile(this.tar)
                    this.mount()
                }
            }
        },
        'html': {
            update: function(next) {
                $(this.tar).html(next === undefined ? '' : next)
            }
        },
        'attr': {
            multi: true,
            bind: function(attname) {
                this.attname = attname
            },
            update: function(next) {
                if (!next && next !== '') {
                    $(this.tar).removeAttr(this.attname)
                } else {
                    $(this.tar).attr(this.attname, next)
                }
            }
        },
        'show': {
            update: function(next) {
                this.tar.style.display = next ? '' : 'none'
            }
        },
        'on': {
            multi: true,
            watch: false,
            bind: function(evtType, handler /*, expression*/ ) {
                var fn = handler
                if (util.type(fn) !== 'function') throw new Error('"' + conf.namespace + 'on" only accept function')
                this.fn = fn.bind(this.vm)
                this.type = evtType
                this.tar.addEventListener(evtType, this.fn, false)
            },
            unbind: function() {
                if (this.fn) {
                    this.tar.removeEventLisnter(this.type, this.fn)
                    this.fn = null
                }
            }
        },
        'class': {
            multi: true,
            bind: function(className) {
                this.className = className
            },
            update: function(next) {
                var $el = $(this.tar)
                if (next) $el.addClass(this.className)
                else $el.removeClass(this.className)
            }
        }
    }
}
