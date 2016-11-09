/**
 *  Build-in Global Custom-Elements
 */

'use strict';

var $ = require('./dm')
var conf = require('./conf')
var util = require('./util')
var is = require('./is')
var Scope = require('./scope')
var Expression = require('./expression')

module.exports = function() {
    return {
        'if': {
            multiExpr: 'exclusion',
            bind: function(cnd, exprs) {
                this._tmpCons = exprs.map(function () {
                    return document.createDocumentFragment()
                })

                /**
                 *  Initial unmount childNodes
                 */
                var cursor = 0
                ;[].slice
                    .call(this.$el.childNodes)
                    .forEach(function(e) {
                        if (is.ElseElement(e)) {
                            cursor ++
                        } else {
                            this._tmpCons[cursor].appendChild(e)
                        }
                    }.bind(this))

                /**
                 *  Instance method
                 */
                var mounteds = {}
                this._mount = function (index) {
                    if (mounteds[index]) return
                    mounteds[index] = true
                    var $floor = this.$floor()
                    $floor.parentNode.insertBefore(this._tmpCons[index], $floor)
                }
                this._unmount = function (index) {
                    if (!mounteds) return
                    mounteds[index] = false
                    var $ceil = this.$ceil()
                    var $floor = this.$floor()

                    var that = this
                    util.domRange($ceil.parentNode, $ceil, $floor)
                        .forEach(function(n) {
                            that._tmpCons[index].appendChild(n)
                        })
                }
                this.compileds = {}
                this._lIndex = -1
            },
            update: function(next) {
                var lIndex = this._lIndex
                var rearIndex = next.length - 1
                var tIndex = -1
                var cnd = false
                next.some(function (v, i) {
                    if (v) tIndex = i
                    return !!v
                })

                cnd = next[tIndex]
                // is last else without condition
                if (!~tIndex && next.length > 1 && !this.$expr[rearIndex]) {
                    tIndex = rearIndex
                    cnd = true
                }

                this._lIndex = tIndex
                if (lIndex != tIndex && ~lIndex) {
                    this._unmount(lIndex)
                }

                // not else and all conditions is false
                if (!~tIndex) return

                if (!cnd) {
                    this._unmount(tIndex)
                } else if (this.compileds[tIndex]) {
                    this._mount(tIndex)
                } else {
                    this.compileds[tIndex] = true
                    this.$vm.$compile(this._tmpCons[tIndex], this.$scope)
                    this._mount(tIndex)
                }
            },
            unbind: function () {
                this.$update = this._mount = this._unmount = noop
                this.compileds = this._tmpCons = null
            }
        },
        'repeat': {
            bind: function(items, expr) {
                var name = this.$el.getAttribute('ref')
                var that = this
                if (name) {
                    this.$vm.$refs[name] = this
                }
                this.$items = function() {
                    return this.$vms
                },
                this.$itemBindings = function(index) {
                    if (!that.$vms || !that.$vms.length) return []
                    var target = that.$vms[index]
                    if (!target) return []
                    return target.$scope.bindings
                }
                this.child = this.$el.firstElementChild
                this.expr = expr
                if (!this.child) {
                    return console.warn('"' + conf.namespace + 'repeat"\'s childNode must has a HTMLElement node. {' + expr + '}')
                }
                // if use filter, Zect can't patch array by array-method
                this._noArrayFilter = Expression.notFunctionCall(expr)
            },
            unbind: function () {
                this.$vms && this.$vms.forEach(function (vm) {
                    destroyVM(vm)
                })
                this.child = this.$vms = this._lastItems = null
                this.$items = this.$itemBindings = noop
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
                this._lastItems[index] = nv

                var $vm = this.$vms[index]
                updateVMData($vm, nv, index, payload.path)
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
                                ind === 0 
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
                                     .forEach(function (vm) {
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
                            if (i !== 0) {
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
                    this._lastItems = util.copyArray(items)
                    return
                }
                /**
                 *  vms diff
                 */
                var source = this._lastItems 
                                ? this._lastItems.map(function (item) {
                                        return {
                                            data: item
                                        }
                                    })
                                : null
                var diffItems = items.map(function (item, index) {
                    var data = {
                        data: item
                    }
                    if (!source) {
                        data.status = 'created'
                    } else {
                        var i = -1
                        var dontUpdated
                        source.some(function (s, k) {
                            if (s.used) return

                            var hasDiff = util.diff(s.data, item)
                            if (!hasDiff) {
                                i = k
                                // and reuse the pos
                                if (index === i) return (dontUpdated = true)
                                else if (!~i) i = k
                            }
                        })
                        if (~i && dontUpdated) {
                            source[i].used = true
                            data.status = 'reused'
                        } else if (~i) {
                            source[i].used = true
                            data.status = 'moved'
                            data.from = i
                        } else {
                            source.some(function (s, k) {
                                if (!s.used && index == k) {
                                    i = k
                                    return true
                                }
                            })
                            if (~i) {
                                source[i].used = true
                                data.status = 'updated'
                                data.from = i
                            } else {
                                data.status = 'created'
                            }
                        }
                    }
                    return data
                })

                
                /**
                 * reuse those instance that data changed and index unmatch
                 * state from "created" to "recycled"
                 */
                var reusables = (source || []).reduce(function (collects, item, index) {
                    if (!item.used) {
                        collects.push(index)
                    }
                    return collects
                }, [])

                diffItems.some(function (item) {
                    if (!reusables.length) return true

                    if (item.status == 'created') {
                        item.from = reusables.pop()
                        item.status = 'recycled'
                    }
                })
                /**
                 * destroy
                 */
                reusables.forEach(function (i) {
                    destroyVM(that.$vms[i])
                })
                /**
                 * Patch
                 */
                var floor = $ceil
                this.$vms = diffItems.map(function (item, index) {
                    var vm
                    switch (item.status) {
                        case 'created':
                            vm = createSubVM.call(that, item.data, index)
                            break
                        case 'updated':
                            vm = that.$vms[index]
                            updateVMData(vm, item.data, index, kp)
                            break
                        case 'moved':
                            vm = that.$vms[item.from]
                            updateVMIndex(vm, index)
                            break
                        case 'reused':
                            vm = that.$vms[index]
                            break
                        case 'recycled':
                            vm = that.$vms[item.from]
                            updateVMData(vm, item.data, item.from, kp)
                            break
                    }
                    var $compiler = vm.$compiler
                    if (!$compiler.$preTo(floor)) {
                        vm.$compiler.$insertAfter(floor)
                    }
                    floor = $compiler.$floor()
                    return vm
                })
                // prevent data source changed
                this._lastItems = util.copyArray(items)
            }
        }
    }
}
function shallowClone (data) {
    return util.type(data) == 'object' ? util.copyObject(data) : {}
}
// function RepeatViewModel (el, data, index, parentVM, parentScope) {
//     data = shallowClone(data)
//     data.$index = index
//     data.$value = data
//     var $scope = new Scope(data, parentScope)
//     // on the top of current scope
//     parentScope && parentScope.children.push($scope)
//     this.$index = index
//     this.$value = data
//     this.$compiler = parentVM.$compile(el, $scope)
//     this.$scope = $scope
// }
/**
 *  create a sub-vm for array item with specified index
 */
function createSubVM (item, index) {
    var subEl = this.child.cloneNode(true)
    var data = shallowClone(item)

    data.$index = index
    data.$value = item

    var $scope = new Scope(data, this.$scope)
    // this.$scope is a parent scope, 
    // on the top of current scope
    if(this.$scope) {
        this.$scope.children.push($scope)
        // data.$parent = this.$scope.data
    }
    return {
        $index: index,
        $value: item,
        $compiler: this.$vm.$compile(subEl, $scope),
        $scope: $scope
    }
}
function updateVMData (vm, data, index, mounted) {
    // next time will add props to data object
    var $data = vm.$scope.data = shallowClone(data)
    $data.$index = index
    $data.$value = data
    // $data.$parent = vm.$scope.$parent ? vm.$scope.$parent.data : null

    vm.$value = data
    vm.$index = index
    vm.$scope.$update(mounted || '')
}
function updateVMIndex (vm, index) {
    vm.$index = index
    var $data = vm.$scope.data
    $data.$index = index
    vm.$scope.$update()
}
function destroyVM (vm) {
    var $parent = vm.$scope.$parent
    $parent && $parent.$removeChild(vm.$scope)
    // $compiler be inclued in $scope.bindings probably
    vm.$compiler.$remove().$destroy()
    vm.$scope.bindings.forEach(function (bd) {
        bd.$destroy()
    })                    
}
function noop () {}
