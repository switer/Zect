/**
 *  Preset Global Directives
 */

'use strict';

var $ = require('./dm')
var conf = require('./conf')
var util = require('./util')

module.exports = function(Zect) {
    return {
        'blockif': {
            atom: true,
            mount: function () {
                this.parent.insertBefore(this.$container, this.$after)
            },
            unmount: function () {
                var that = this
                if (!this.inited) {

                    this.inited = true
                    // insert ref
                    this.parent
                        .insertBefore(this.$before, this.tar)

                    $(this.tar).replace(this.$after)
                    // migrate to document fragment container
                    ;[].slice
                        .call(this.tar.childNodes)
                        .forEach(function(e) {
                            this.$container.appendChild(e)
                        }.bind(this))

                } else {
                    util.domRange(this.parent, this.$before, this.$after)
                        .forEach(function(n) {
                            that.$container.appendChild(n)
                        })
                    
                }
            },
            bind: function(cnd, expr) {
                var parent = this.parent = this.tar.parentNode
                this.$before = document.createComment(conf.namespace + 'blockif-{' + expr + '}-start')
                this.$after = document.createComment(conf.namespace + 'blockif-{' + expr + '}-end')
                this.$container = document.createDocumentFragment()
                this.unmount()
            },
            update: function(next) {
                var that = this

                if (!next) {
                    this.unmount()
                } else if (this.compiled) {
                    this.mount()
                } else {
                    this.compiled = true
                    this.vm.$compile(this.$container)
                    this.mount()
                }
            }
        },
        'if': {
            atom: true,
            mount: function () {
                $(this.holder).replace(this.tar)
            },
            unmount: function () {
                $(this.tar).replace(this.holder)
            },
            bind: function(cnd, expr) {
                this.holder = document.createComment(conf.namespace + 'if-{' + expr +'}')
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
        'component': {
            bind: function() {

            },
            update: function() {

            }
        },
        'repeat': {
            atom: true,
            bind: function(items, expr) {
                var $el = $(this.tar)
                this.parent = this.tar.parentNode
                this.holder = document.createComment(conf.namespace + 'repeat-{' +  expr + '}')
                $el.replace(this.holder)
            },
            update: function(items) {
                if (!items || !items.forEach) {
                    return console.warn('"' + conf.namespace + 'repeat" only accept Array data')
                }
                var that = this

                function createSubVM(item, index) {
                    var subEl = that.tar.cloneNode(true)
                    var data = util.type(item) == 'object' ? util.copyObject(item) : {}

                    data.$index = index
                    data.$value = item

                    that.vm.$compile(subEl, {
                        data: data
                    })
                    return {
                        $index: index,
                        $value: item,
                        $el: subEl
                    }
                }

                var vms = new Array(items.length)
                var olds = this.last ? util.copyArray(this.last) : olds
                var oldVms = this.$vms ? util.copyArray(this.$vms) : oldVms

                items.forEach(function(item, index) {
                    var v
                    if (!olds) {
                        v = createSubVM(item, index)
                    } else {
                        var i = olds.indexOf(item)
                        if (~i && !util.diff(olds[i], item)) {
                            // reused
                            v = oldVms[i]
                            // clean
                            olds.splice(i, 1)
                            oldVms.splice(i, 1)
                            // reset $index
                            v.$index = i
                        } else {
                            v = createSubVM(item, index)
                        }
                    }
                    vms[index] = v
                })
                this.$vms = vms
                this.last = util.copyArray(items)

                var $floor = this.holder
                // from rear to head
                var len = vms.length
                while (len--) {
                    var v = vms[len]
                    that.parent.insertBefore(v.$el, $floor)
                    $floor = v.$el
                }
                oldVms && oldVms.forEach(function(v) {
                    $(v.$el).remove()
                })
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
