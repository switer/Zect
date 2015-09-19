/**
 *  Build-in Global Custom-Elements
 */

'use strict';

var $ = require('./dm')
var conf = require('./conf')
var util = require('./util')
var Scope = require('./scope')
var Expression = require('./expression')

function _getData (data) {
    return util.type(data) == 'object' ? util.copyObject(data) : {}
}
/**
 *  create a sub-vm for array item with specified index
 */
function createSubVM(item, index) {
    var subEl = this.child.cloneNode(true)
    var data = _getData(item)

    data.$index = index
    data.$value = item

    var $scope = new Scope(data, this.$scope)
    // this.$scope is a parent scope, 
    // on the top of current scope
    if(this.$scope) {
        this.$scope.children.push($scope)
    }
    return {
        $index: index,
        $value: item,
        $compiler: this.$vm.$compile(subEl, $scope),
        $scope: $scope
    }
}
function updateVMIndex (vm, index) {
    vm.$index = index
    var $data = vm.$scope.data
    $data.$index = index
    vm.$scope.$update()
}
function destroyVM (vm) {
    var $parent = vm.$scope.$parent
    $parent && $parent.$removeChild($scope)
    // $compiler be inclued in $scope.bindings probably
    vm.$compiler.$remove().$destroy()
    vm.$scope.bindings.forEach(function (bd) {
        bd.$destroy()
    })                    
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

                    var $parent = this.$scope || new Scope()
                    // inherit parent scope's properties
                    var $scope = new Scope($parent.data, $parent)
                    var protoUpdate = $scope.$update
                    $scope.$update = function () {
                        // the "if" element is sharing with $scope.data, 
                        // so it need to be updated
                        $scope.data = $parent.data
                        protoUpdate.apply($scope, arguments)
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
                // if use filter, Zect can't patch array by array-method
                this._noArrayFilter = Expression.notFunctionCall(expr)
            },
            delta: function (nv, pv, kp) {
                if (!kp) return false
                var exprProp = util.normalize(Expression.strip(this.$expr).trim())
                var path = kp.replace(exprProp, '')
                var index
                var matches
                /**
                 * 1. mount.0
                 * 2. mount.0.0.prop
                 * 3. $value.prop
                 */
                if (exprProp == '$value' && (matches = path.match(/^\d+\.(\d+)(\.|$)/))) {
                    path = path.replace(/\d+\.?/, '')
                } else if (matches = path.match(/^\.(\d+)(\.|$)/)) {
                    path = path.replace(/^\./, '')
                } else {
                    return false
                }
                index = Number(matches[1])
                // can be delta update
                if (this.$vms && index < this.$vms.length) return {
                    index: index,
                    path:  path,
                    mount: exprProp
                }
                else return false
            },
            deltaUpdate: function (nextItems, preItems, kp, payload) {
                var index = payload.index
                var nv = nextItems[index]
                // delta update
                this.last[index] = nv

                var $vm = this.$vms[index]
                var $data = $vm.$scope.data = _getData(nv)
                $data.$index = index
                $data.$value = nv

                $vm.$value = nv
                $vm.$index = index
                $vm.$scope.$update(payload.path || '')
            },
            update: function(items, preItems, kp, method, args) {
                if (!items || !items.forEach) {
                    return console.warn('"' + conf.namespace + 'repeat" only accept Array data. {' + this.expr + '}')
                }
                var that = this
                var valueOnly = Expression.variableOnly(this.$expr)
                
                // it's not modify
                if (valueOnly && method == 'splice' && args.length == 2 && (!args[1] || args[1] < 0)) return

                var $floor = this.$floor()
                var $ceil = this.$ceil()
                var arrayPatcher = {
                    splice: function () {
                        var ind = Number(args[0] || 0)
                        var len = Number(args[1] || 0)
                        var max = this.$vms.length
                        ind = ind > max ? max : ind
                        if (args.length > 2) {
                            /**
                             *  Insert
                             */
                            // create vms for each inserted item
                            var insertVms = [].slice.call(args, 2).map(function (item, index) {
                                return createSubVM.call(that, item, ind + index)
                            })
                            // insert items into current $vms
                            this.$vms.splice.apply(this.$vms, [ind, len].concat(insertVms))

                            // element bound for inserted item vm element
                            $(insertVms.map(function (vm) {
                                return vm.$compiler.$bundle()
                            })).insertAfter(
                                ind == 0 
                                ? $ceil
                                : this.$vms[ind - 1].$compiler.$bundle()
                            )
                            // get last update index
                            var start = ind + insertVms.length
                            this.$vms.forEach(function (vm, i) {
                                if (i >= start) {
                                    updateVMIndex(vm, i)
                                }
                            })

                        } else {
                            /**
                             *  remove
                             */
                            this.$vms.splice
                                     .apply(this.$vms, args)
                                     .forEach(function (vm, i) {
                                        destroyVM(vm)
                                     })

                            this.$vms.forEach(function (vm, i) {
                                if (i >= ind) {
                                    updateVMIndex(vm, i)
                                }
                            })
                        }
                    },
                    push: function () {
                        var index = items.length - 1
                        var vm = createSubVM.call(that, items[index], index)
                        this.$vms.push(vm)
                        vm.$compiler.$insertBefore($floor)
                    },
                    pop: function () {
                        var vm = this.$vms.pop()
                        destroyVM(vm)
                    },
                    shift: function () {
                        var vm = this.$vms.shift()
                        destroyVM(vm)
                        this.$vms.forEach(function (v, i) {
                            updateVMIndex(v, i)
                        })
                    },
                    unshift: function () {
                        var vm = createSubVM.call(that, items[0], 0)
                        this.$vms.unshift(vm)
                        vm.$compiler.$insertAfter($ceil)
                        this.$vms.forEach(function (v, i) {
                            if (i != 0) {
                                updateVMIndex(v, i)
                            }
                        })
                    },
                    $concat: function () {
                        var len = this.$vms.length
                        $(items.slice(len).map(function (item, i) {
                            var vm = createSubVM.call(that, item, i + len)
                            that.$vms.push(vm)
                            return vm.$compiler.$bundle()
                        })).insertBefore($floor)
                    }
                }

                var patch = arrayPatcher[method]
                if (valueOnly && this._noArrayFilter && patch) {
                    patch.call(this)
                    this.last = util.copyArray(items)
                    return
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
                        v = createSubVM.call(that, item, index)
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
                            v = createSubVM.call(that, item, index)
                        }
                    }
                    vms[index] = v
                })
                
                this.$vms = vms
                this.last = util.copyArray(items)
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
                oldVms && oldVms.forEach(destroyVM)
            }
        }
    }
}
