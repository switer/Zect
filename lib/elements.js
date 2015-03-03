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
            pack: function () {
                var $ceil = this.ceil()
                var $floor = this.floor()
                var $con = this.$container
                var that = this

                if (!$con.contains($ceil)) {
                    util.domRange($ceil.parentNode, $ceil, $floor)
                        .forEach(function(n) {
                            that.$container.appendChild(n)
                        })
                    $con.insertBefore($ceil, $con.firstChild)
                    $con.appendChild($floor)
                }
                return $con
            },
            destroy: function () {
                this.$container = null
                this.$before = null
                this.$after = null
            },
            floor: function () {
                return this.$after
            },
            ceil: function () {
                return this.$before
            },
            bind: function(cnd, expr) {
                this._tmpCon = document.createDocumentFragment()
                /**
                 *  Initial unmount childNodes
                 */
                ;[].slice
                    .call(this.tar.childNodes)
                    .forEach(function(e) {
                        this.$container.insertBefore(e, this.floor())
                    }.bind(this))

                /**
                 *  Instance method
                 */
                var mounted
                this._mount = function () {
                    if (mounted) return
                    mounted = true
                    var $floor = this.floor()
                    $floor.parentNode.insertBefore(this._tmpCon, $floor)

                }
                this._unmount = function () {
                    if (!mounted) return
                    mounted = false
                    var $ceil = this.ceil()
                    var $floor = this.floor()

                    util.domRange($ceil.parentNode, $ceil, $floor)
                        .forEach(function(n) {
                            this._tmpCon.appendChild(n)
                        })
                }
            },
            update: function(next) {
                var that = this

                if (!next) {
                    this._unmount()
                } else if (this.compiled) {
                    this._mount()
                } else {
                    this.compiled = true
                    this.vm.$compile(this._tmpCon)
                    this._mount()
                }
            }
        },
        'repeat': {
            pack: function () {
                var $ceil = this.ceil()
                var $floor = this.floor()
                var $con = this.$container
                var that = this

                if (!$con.contains($ceil)) {
                    util.domRange($ceil.parentNode, $ceil, $floor)
                        .forEach(function(n) {
                            that.$container.appendChild(n)
                        })
                    $con.insertBefore($ceil, $con.firstChild)
                    $con.appendChild($floor)
                }
                return $con
            },
            floor: function () {
                return this.$after
            },
            ceil: function () {
                return this.$before
            },
            bind: function(items, expr) {
                this.child = this.tar.firstElementChild

                if (!this.child) {
                    return console.warn('"' + conf.namespace + 'repeat"\'s childNode must has a HTMLElement node')
                }
            },
            destroy: function () {
                this.$container = null
                this.$before = null
                this.$after = null
            },
            update: function(items) {
                if (!items || !items.forEach) {
                    return console.warn('"' + conf.namespace + 'repeat" only accept Array data')
                }
                var that = this
                function createSubVM(item, index) {
                    var subEl = that.child.cloneNode(true)
                    var data = util.type(item) == 'object' ? util.copyObject(item) : {}

                    data.$index = index
                    data.$value = item
                    var cvm = that.vm.$compile(subEl, {
                        data: data,
                        root: that.child
                    })
                    return {
                        $index: index,
                        $value: item,
                        $compiler: cvm
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

                var $floor = this.floor()
                // from rear to head
                var len = vms.length
                var i = 0
                while (i < len) {
                    var v = vms[i++]
                    $floor.parentNode.insertBefore(v.$compiler.pack(), $floor)
                }

                oldVms && oldVms.forEach(function(v) {
                    v.$compiler.pack()
                    v.$compiler.destroy()
                })
            }
        }
    }
}
