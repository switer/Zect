var $ = require('./dm')
var is = require('./is')
var Mux = require('./mux')
var util = require('./util')
var conf = require('./conf')

var Compiler = require('./compiler')
var Directive = Compiler.Directive
var AttributeDirective = Compiler.Attribute
var TextDirective = Compiler.Text
var ElementDirective = Compiler.Element

/**
 *  private vars
 */
var presetDirts = require('./directives')(Zect)  // preset directives getter
var elements = require('./elements')(Zect)      // preset directives getter
var allDirectives = [presetDirts, {}]                // [preset, global]
var gdirs = allDirectives[1]
var gcomps = {}                                 // global define components

function _funcOrObject(obj, prop) {
    var tar = obj[prop]
    return util.type(tar) == 'function' ? tar.call(obj):tar
}
/**
 *  Global API
 */
function Zect(options) {
    var insOpt = _mergeMethodMixins([options])
    return ViewModel.call(this, insOpt)
}
Zect.extend = function(options) {
    return function(opt) {
        var insOpt = _mergeMethodMixins([options, opt])
        /**
         *  Prototype inherit
         */
        util.insertProto(this, Zect.prototype)
        return ViewModel.call(this, insOpt)
    }
}
Zect.component = function(id, definition) {
    var Comp = Zect.extend(definition)
    gcomps[id.toLowerCase()] = Comp
    return Comp
}
Zect.directive = function(id, definition) {
    gdirs[id] = definition
}
Zect.namespace = function(ns) {
    conf.namespace = ns
}

/*******************************
      ViewModel Constructor
*******************************/
function ViewModel(options) {
    // inherit Compiler
    util.insertProto(this, Compiler.prototype)
    // inherit Compile
    var vm = this
    var el = options.el
    var components = [gcomps, options.components || {}]
    var directives = allDirectives.concat([options.directives || {}])

    var _directives = [] // private refs for all directives instance of the vm    
    var _components = [] // private refs for all components    
    var NS = conf.namespace
    var componentProps = [NS + 'component', NS + 'data', NS + 'methods']

    /**
     *  Mounted element detect
     */
    if (el && options.template) {
        vm.$children = el.childNodes
        el.innerHTML = options.template
    } else if (options.template) {
        el = document.createElement('div')
        el.innerHTML = options.template
    } else if (util.type(el) == 'string') {
        el = document.querySelector(el)
    } else if (!is.Element(el)) {
        throw new Error('Unmatch el option')
    }
    // replate template holder DOM
    if (el.children.length == 1 && el.firstElementChild.tagName.toLowerCase() == (NS + 'template')) {
        var $holder = el.firstElementChild
        var $childrens = _slice($holder.childNodes)
        var attributes = _slice($holder.attributes)

        el.removeChild($holder)
        /**
         *  Migrate childNodes
         */
        $childrens.forEach(function (n) {
            el.appendChild(n)
        })
        /**
         *  Merge attributes
         */
        attributes.forEach(function (att) {
            if (!el.hasAttribute(att.name)) el.setAttribute(att.name, att.value)
        })
    }

    vm.$el = el

    /**
     *  get component define by tagName
     */
    vm.$component = getComponent

    /**
     *  Component instance refs
     */
    vm.$refs = {}

    /**
     *  assign methods
     */
    var methods = {}
    util.objEach(options.methods, function(k, v) {
        if (util.type(v) !== 'function') return console.warn(k + ' is not a function.')
        vm[k] = methods[k] = v.bind(vm)
    })
    vm.$methods = methods

    var $data
    var dataOpt = {}

    Object.defineProperty(vm, '$data', {
        enumerable: true,
        get: function() {
            // $data will be undefined in created calling, so using dataOpt as temporary
            return $data || dataOpt
        },
        set: function(v) {
            $data.$set(v)
        }
    })
    vm.$set = function () {
        $data.$set.apply($data, arguments)
    }
    vm.$get = function () {
        return $data.$get.apply($data, arguments)
    }
    vm.$watch = function (fn) {
        if (util.type(fn) !== 'function') return console.warn('Listener handler is not a function.')
        return $data.$watch(fn)
    }
    vm.$unwatch = function (fn) {
        return $data.$unwatch(fn)
    }

    if (options.$data) {
        $data = options.$data
        // if state model instance passsing, call after set
        options.created && options.created()
    } else {
        // Call before vm-$data instance
        options.created && options.created()

        util.merge(dataOpt, _funcOrObject(options, 'data'))
        
        // Instance observable state model
        var mopts = {
            deep: true,
            props: dataOpt,
            computed: options.computed,
            computedContext: vm
        }
        $data = new Mux(mopts)
    }

    /**
     *  DOM Compile
     *  @TODO the unique interface for a compiled node($el, $remove)
     */
    vm.$compile = function (el, scope) {
        var compiler
        var id = 0
        util.walk(el, function (node) {
            var isRoot = node === el
            var result = compile(node, scope, isRoot)
            if (isRoot) compiler = result.inst
            return result.into
        })
        return compiler
    }

    var beforeDestroy = options.destroy
    vm.$destroy = function () {
        beforeDestroy && beforeDestroy.call(vm)

        ;[_components, _directives].forEach(function (items) {
            items.forEach(function (inst) {
                inst.$destroy()
            })
        })

        $data.$destroy()

        // instance methods/properties
        vm.$el = null
        vm.$get = null
        vm.$set = null
        vm.$refs = null
        vm.$watch = null
        vm.$unwatch = null
        vm.$compile = null
        vm.$component = null

        // private vars
        directives = null
        components = null
        _directives = null
        _components = null

        // marked
        vm.$destroyed = true
    }
    vm.$compiler = vm.$compile(el)

    /**
     *  Call ready after compile
     */
    options.ready && options.ready.call(vm)

    function _setBindings2Scope (scope, ref) {
        scope && scope.bindings && (scope.bindings.push(ref))
    }

    function compile (node, scope, isRoot) {
        /**
         *  1. ELEMENT_NODE; 
         *  2. ATTRIBUTE_NODE; 
         *  3. TEXT_NODE; 
         *  8. COMMENT_NODE; 
         *  9. DOCUMENT_NODE; 
         *  11. DOCUMENT_FRAGMENT;
         */
        var into = true
        var inst
        switch (node.nodeType) {
            case 1:
                /**
                 *  scope syntax
                 */
                if (inst = compileElement(node, scope, isRoot)) {
                    into = false
                    break
                }
                /**
                 *  Attribute directive
                 */
                compileDirective(node, scope)
                /**
                 *  Compile custom-element
                 */
                if (inst = compileComponent(node, vm, scope, isRoot)) {
                    // inst = new Compiler(node)
                    into = false
                    break
                }
                break
            case 3:
                inst = compileText(node, vm, scope, isRoot)
                into = false
                break
            case 11:
                // document fragment
                break
            default:
                into = false
        }
        return {
            into: !!into,
            inst: !inst && isRoot ? new Compiler(node) : inst
        }
    }

    /**
     *  Reverse component Constructor by tagName
     */
    function getComponent(tn) {
        var cid = tn.toLowerCase()
        var compDef
        components.some(function (comp) {
            if (comp.hasOwnProperty(cid)) {
                compDef = comp[cid]
                return true
            }
        })
        return compDef
    }
    /**
     *  Compile element for block syntax handling
     */
    function compileElement(node, scope, isRoot) {
        var tagName = node.tagName
        switch(true) {
            /**
             *  <*-if></*-if>
             */
            case is.IfElement(tagName):
                var inst = new ElementDirective(
                        vm, 
                        scope,
                        node, 
                        elements['if'], 
                        NS + 'if', 
                        $(node).attr('is')
                )
                if (!isRoot) {
                    inst.$mount(node)
                }
                // save elements refs
                _directives.push(inst)
                // save bindins to scope
                _setBindings2Scope(scope, inst)
                return inst
            /**
             *  <*-repeat></*-repeat>
             */
            case is.RepeatElement(tagName):
                var inst = new ElementDirective(
                        vm, 
                        scope,
                        node, 
                        elements['repeat'],
                        NS + 'repeat', 
                        $(node).attr('items')
                )
                if (!isRoot) {
                    inst.$mount(node)
                }
                _directives.push(inst)
                _setBindings2Scope(scope, inst)
                return inst
        }
    }

    /**
     *  comment
     */
    function compileComponent (node, parentVM, scope) {
        var $node = $(node)
        var CompName = $node.attr(NS + 'component') || node.tagName
        var Comp = getComponent(CompName)

        /**
         *  Tag is not a custom element
         */
        if (!Comp) return

        $node.removeAttr(NS +'component')

        // don't need deep into self
        if (node === parentVM.$el) return

        var ref = $(node).attr('ref')

        var dataExpr = $node.attr(NS + 'data')
        var methods = $node.attr(NS + 'methods')
        $node.removeAttr(NS + 'data').removeAttr(NS + 'methods')

        var _isDataExpr = util.isExpr(dataExpr)
        var bindingData
        var bindingMethods
        /**
         *  Watch
         */
        var sep = ';'
        var sepRegexp = new RegExp(sep, 'g')
        var ast = {}
        var revealAst = {}
        var compVM

        function _executeBindingMethods () {
            var methodObjExpr = methods.replace(sepRegexp, ',')
            return util.isExpr(methods) 
                    ? Compiler.execute(parentVM, scope, methodObjExpr) 
                    : {}
        }
        function _executeBindingData () {
            var dataObjExpr = dataExpr.replace(sepRegexp, ',')
            return util.isExpr(dataExpr) 
                    ? Compiler.execute(parentVM, scope, dataObjExpr) 
                    : {}
        }
        function _parseExpr (expr) {
            var name
            var expr = expr.replace(/^[^:]+:/, function (m) {
                            name = m.replace(/:$/, '').trim()
                            return ''
                        }).trim()
            return {
                name: name,
                expr: expr,
                vars: Compiler.extractVars(expr)
            }
        }
        function _setBindingObj (expr) {
            var r = _parseExpr(expr)
            ast[r.name] = r
            ;(r.vars || []).forEach(function (v) {
                revealAst[v] = r.name
            })
        }

        var bindingData = _executeBindingData()
        var bindingMethods = _executeBindingMethods() // --> bindingMethods
        
        compVM = new Comp({
            el: node,
            data: bindingData,
            methods: bindingMethods,
            $parent: parentVM
        })

        var plainDataExpr = _isDataExpr ? Compiler.stripExpr(dataExpr) : ''
        if (plainDataExpr) {
            if (plainDataExpr.match(sep)) {
                plainDataExpr.replace(new RegExp(sep + '\\s*$'), '') // trim last seperator
                       .split(sep)
                       .forEach(_setBindingObj)
            } else {
                _setBindingObj(plainDataExpr)
            }
        }
        // watch and binding
        if (_isDataExpr) {
            parentVM.$data.$watch(function (keyPath, nv) {
                var nextState
                util.objEach(revealAst, function (varName, bindingName) {
                    if (keyPath.indexOf(varName) === 0) {
                        !nextState && (nextState = {})
                        nextState[bindingName] = Compiler.execute(parentVM, scope, ast[bindingName].expr)
                    }
                })
                nextState && compVM.$set(nextState)
            })
        }
        // set ref to parentVM
        ref && (parentVM.$refs[ref] = compVM)

        _components.push(compVM)
        _setBindings2Scope(scope, compVM)

        // TBM -- to be modify, instance method show not be attached here
        compVM.$update = function () {
            _isDataExpr && compVM.$set(_executeBindingData())
        }

        return compVM
    }

    /**
     *  Compile attributes to directive
     */
    function compileDirective (node, scope) {
        var value = node.nodeValue
        var attrs = _slice(node.attributes)
        var ast = {
                attrs: {},
                dires: {}
            }

        /**
         *  attributes walk
         */
        attrs.forEach(function(att) {
            var aname = att.name
            var v = att.value
            // parse att
            if (~componentProps.indexOf(aname)) {
                return
            }else if (util.isExpr(aname)) {
                // variable attribute name
                ast.attrs[aname] = v
            } else if (aname.indexOf(NS) === 0) {
                // directive
                ast.dires[aname] = v
            } else if (util.isExpr(v.trim())) {
                // named attribute with expression
                ast.attrs[aname] = v
            } else {
                return
            }
            node.removeAttribute(aname)
        })

        /**
         *  Attributes binding
         */
        util.objEach(ast.attrs, function(name, value) {
            var attd = new AttributeDirective(vm, scope, node, name, value)
            _directives.push(attd)
            _setBindings2Scope(scope, attd)
        })

        /**
         *  Directives binding
         */
        directives.forEach(function(group) {
            util.objEach(group, function(id, def) {
                var dname = NS + id
                var expr = ast.dires[dname]

                if (ast.dires.hasOwnProperty(dname)) {
                    var sep = ';'
                    var d
                    // multiple defines expression parse
                    if (def.multi && expr.match(sep)) {
                        Compiler.stripExpr(expr)
                                .split(sep)
                                .forEach(function(item) {
                                    d = new Directive(vm, scope, node, def, dname, '{' + item + '}')
                                    _directives.push(d)
                                    _setBindings2Scope(scope, d)
                                })
                    } else {
                        d = new Directive(vm, scope, node, def, dname, expr)
                        _directives.push(d)
                        _setBindings2Scope(scope, d)
                    }
                }
            })
        })
    }

    function compileText (node, vm, scope) {
        var originExpr = node.nodeValue
        var v = originExpr.replace(/\\{/g, '\uFFF0')
                          .replace(/\\}/g, '\uFFF1')
        var exprReg = /\{[\s\S]*?\}/g
        var parts = v.split(exprReg)
        var exprs = v.match(exprReg)
        var inst
        // expression match or not
        if (exprs && exprs.length) {
            inst = new TextDirective(vm, scope, node, originExpr, parts, exprs)
            _directives.push(inst)
            _setBindings2Scope(scope, inst)
        }
        return inst
    }
}

/**
 *  Interal functions
 */
function _slice (obj) {
    return [].slice.call(obj)
}
function _extend (args) {
    return util.extend.apply(util, args)
}
function _mergeOptions (opts) {
    var dest = {}
    _extend([dest].concat(opts))
    ;['data', 'methods', 'directives', 'components'].forEach(function (prop) {
        dest[prop] = _extend([{}].concat(opts.map(function (opt) {
            return _funcOrObject(opt, prop)
        })))
    })
    return dest
}
function _mergeMethodMixins (optMixins) {
    var mixins = []
    /**
     *  Merge option mixins
     */
    optMixins.forEach(function (o) {
        if (o) {
            mixins.push(o)
            o.mixins && (mixins = mixins.concat(o.mixins))
        }
    })
    var insOpt = _mergeOptions(mixins)
    /**
     *  Merge method mixins
     */
    var m = insOpt.methods = insOpt.methods || {}
    optMixins.forEach(function (o) {
        var mxs = o && o.methods && o.methods.mixins
        if (mxs) {
            mxs.forEach(function (mx) {
                util.objEach(mx, function (k, v) {
                    if (k !== 'mixins') m[k] = v
                })
            })
        }
    })
    delete insOpt.methods.mixins
    return insOpt
}

module.exports = Zect
