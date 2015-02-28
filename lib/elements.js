/**
 *  Preset Global Custom-Elements
 */

'use strict';

var $ = require('./dm')
var conf = require('./conf')
var util = require('./util')

module.exports = function(Zect) {
    return {
        'if': {
            bind: function(cnd, expr) {
                var parent = this.parent = this.tar.parentNode
                this.$before = document.createComment(conf.namespace + 'blockif-{' + expr + '}-start')
                this.$after = document.createComment(conf.namespace + 'blockif-{' + expr + '}-end')
                this.$container = document.createDocumentFragment()


                /**
                 *  Initial unmount childNodes
                 */
                parent.insertBefore(this.$before, this.tar)
                $(this.tar).replace(this.$after)
                // migrate to document fragment container
                ;[].slice
                    .call(this.tar.childNodes)
                    .forEach(function(e) {
                        this.$container.appendChild(e)
                    }.bind(this))


                console.log(parent)
                /**
                 *  Instance method
                 */
                var mounted
                this.mount = function () {
                    if (mounted) return
                    mounted = true
                    parent.insertBefore(this.$container, this.$after)

                }
                this.unmount = function () {
                    if (!mounted) return
                    mounted = false
                    var that = this
                    util.domRange(parent, this.$before, this.$after)
                        .forEach(function(n) {
                            that.$container.appendChild(n)
                        })
                        
                }
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
        'repeat': {
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
        }
    }
}
