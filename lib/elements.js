/**
 *  Preset Global Custom-Elements
 */

'use strict';

var $ = require('./dm')
var conf = require('./conf')
var util = require('./util')

function _getData (data) {
    return util.type(data) == 'object' ? util.copyObject(data) : {}
}

module.exports = function(Zect) {
    return {
        'if': {
            bind: function(/*cnd, expr*/) {
                this._tmpCon = document.createDocumentFragment()
                /**
                 *  Initial unmount childNodes
                 */
                ;[].slice
                    .call(this.$el.childNodes)
                    .forEach(function(e) {
                        this._tmpCon.appendChild(e)
                    }.bind(this))

                /**
                 *  Instance method
                 */
                var mounted
                this._mount = function () {
                    if (mounted) return
                    mounted = true
                    var $floor = this.$floor()
                    $floor.parentNode.insertBefore(this._tmpCon, $floor)

                }
                this._unmount = function () {
                    if (!mounted) return
                    mounted = false
                    var $ceil = this.$ceil()
                    var $floor = this.$floor()

                    var that = this
                    util.domRange($ceil.parentNode, $ceil, $floor)
                        .forEach(function(n) {
                            that._tmpCon.appendChild(n)
                        })
                }
            },
            update: function(next) {
                if (!next) {
                    this._unmount()
                } else if (this.compiled) {
                    this._mount()
                } else {
                    this.compiled = true

                    var $parent = this.$scope || {}
                    var $scope = {
                        data: $parent.data, // inherit parent scope's properties
                        bindings: [],
                        children: [],
                        $parent: $parent
                    }
                    var that = this
                    $scope.$update = function () {
                        $scope.data = $parent.data
                        this.bindings.forEach(function (bd) {
                            bd.$update()
                        })
                        this.children.forEach(function (child) {
                            child.$update()
                        })
                    }
                    var $update = this.$update

                    // hook to $update interface
                    this.$update = function () {
                        $scope.$update()
                        $update.apply(this, arguments)
                    }
                    if(this.$scope) {
                        this.$scope.children.push($scope)
                    }
                    this.$vm.$compile(this._tmpCon, $scope)

                    this._mount()
                }
            }
        },
        'repeat': {
            bind: function(items, expr) {
                this.child = this.$el.firstElementChild
                this.expr = expr
                if (!this.child) {
                    return console.warn('"' + conf.namespace + 'repeat"\'s childNode must has a HTMLElement node. {' + expr + '}')
                }
            },
            delta: function (nv, pv, kp) {
                if (kp && /\d+/.test(kp.split('.')[1])) {
                    var index = Number(kp.split('.')[1])
                    // can be delta update
                    if (this.$vms && index < this.$vms.length) return true
                    else return false
                } else {
                    return false
                }
            },
            deltaUpdate: function (nextItems, preItems, kp) {
                var index = Number(kp.split('.')[1])
                var nv = nextItems[index]
                // delta update
                this.last[index] = nv

                var $vm = this.$vms[index]
                var $data = $vm.$scope.data = _getData(nv)
                $data.$index = index
                $data.$value = nv

                $vm.$value = nv
                $vm.$index = index

                $vm.$scope.$update()
            },
            update: function(items, preItems, kp) {
                if (!items || !items.forEach) {
                    return console.warn('"' + conf.namespace + 'repeat" only accept Array data. {' + this.expr + '}')
                }

                var that = this
                function createSubVM(item, index) {
                    var subEl = that.child.cloneNode(true)
                    var data = _getData(item)

                    data.$index = index
                    data.$value = item

                    var hasParentScope = !!that.$scope

                    var $scope = {
                        data: data,
                        bindings: [], // collect all bindings
                        children: [],
                        $parent: that.$scope || {}
                    }
                    $scope.$update = function () {
                        this.bindings.forEach(function (bd) {
                            bd.$update()
                        })
                        this.children.forEach(function (child) {
                            child.$update()
                        })
                    }

                    if(that.$scope) {
                        that.$scope.children.push($scope)
                    }
                    return {
                        $index: index,
                        $value: item,
                        $compiler: that.$vm.$compile(subEl, $scope),
                        $scope: $scope
                    }
                }

                /**
                 *  vms diff
                 */
                var vms = new Array(items.length)
                var olds = this.last ? util.copyArray(this.last) : olds
                var oldVms = this.$vms ? util.copyArray(this.$vms) : oldVms
                var updateVms = []

                items.forEach(function(item, index) {
                    var v
                    if (!olds) {
                        v = createSubVM(item, index)
                    } else {

                        var i = -1
                        olds.some(function (dest, index) {
                            // one level diff
                            if (!util.diff(dest, item)) {
                                i = index
                                return true
                            }
                        })
                        if (~i) {
                            // reused
                            v = oldVms[i]
                            // clean
                            olds.splice(i, 1)
                            oldVms.splice(i, 1)

                            // reset $index and $value
                            v.$index = index
                            v.$value = item

                            var $data = v.$scope.data = _getData(item)
                            $data.$index = index
                            $data.$value = item
                            updateVms.push(v)
                            
                        } else {
                            v = createSubVM(item, index)
                        }
                    }
                    vms[index] = v
                })

                this.$vms = vms
                this.last = util.copyArray(items)

                var $floor = this.$floor()
                // from rear to head
                var len = vms.length
                var i = 0
                while (i < len) {
                    var v = vms[i++]
                    v.$compiler.$insertBefore($floor)
                }
                updateVms.forEach(function (v) {
                    // reset $index
                    v.$scope.$update()
                })

                updateVms = null

                oldVms && oldVms.forEach(function(v) {
                    v.$scope.bindings.forEach(function (bd) {
                        bd.$destroy()
                    })
                    v.$compiler.$remove().$destroy()
                })
            }
        }
    }
}
