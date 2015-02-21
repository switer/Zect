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
            bind: function() {
                var parent = this.parent = this.tar.parentNode
                this.$holder = document.createComment(conf.namespace + 'if')

                // insert ref
                parent.insertBefore(this.$holder, this.tar)
                // parent.removeChild(this.tar)
            },
            // next: true show || false del
            update: function(next, pre) {
                var that = this

                function mount(tar) {
                    that.parent.insertBefore(that.tar, that.$holder)
                }
                if (!next) {
                    this.parent.contains(this.tar) && this.parent.removeChild(this.tar)
                } else if (this.childVM) {
                    mount()
                } else {
                    this.childVM = new Zect({
                        el: this.tar,
                        $data: this.vm.$data
                    })
                    mount()
                }
            }
        },
        'repeat': {
            bind: function(wkey) {
                var $el = $(this.tar)
                this.$parent = $el.parent()
                this.$holder = document.createComment(conf.namespace + 'repeat')
                $el.replace(this.$holder, this.tar)
                return [wkey]
            },
            update: function(items) {
                if (!items || !items.forEach) {
                    return console.warn('"' + conf.namespace + 'repeat" only accept Array data')
                }
                var that = this

                function createSubVM(item, index) {
                    var $subEl = that.tar.cloneNode(true)
                    var $data = util.type(item) == 'object' ? item : {}
                    $data.$index = index
                    $data.$value = item

                    var subVM = new Zect({
                        el: $subEl,
                        data: $data
                    })

                    subVM.$parentVM = that.vm
                    return subVM
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

                var $floor = this.$holder
                    // from rear to head
                var len = vms.length
                while (len--) {
                    var v = vms[len]
                    that.$parent.get(0).insertBefore(v.$el, $floor)
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
            bind: function(wkey, attname) {
                this.attname = attname
                return [wkey] // those dependencies need to watch
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
            bind: function(wkey) {
                return [wkey] // those dependencies need to watch
            },
            update: function(next) {
                this.tar.style.display = next ? '' : 'none'
            }
        },
        'on': {
            bind: function(wkey, evtType) {
                var fn = this.vm[wkey]
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
            bind: function(wkey, className) {
                this.className = className
                return [wkey]
            },
            update: function(next) {
                var $el = $(this.tar)
                if (next) $el.addClass(this.className)
                else $el.removeClass(this.className)
            }
        }
    }
}
