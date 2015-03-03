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
var componentProps = ['state', 'method']

function funcOrObject(obj, prop) {
    var tar = obj[prop]
    return util.type(tar) == 'function' ? tar.call(obj):tar
}
/**
 *  Global API
 */
function Zect(options) {
    return ViewModel.call(this, options || {})
}
Zect.extend = function(options) {
    return function(opt) {
        var insOpt = {}

        util.extend(insOpt, options, opt)

        ;['data', 'methods', 'directives', 'components'].forEach(function (prop) {
            insOpt[prop] = {}
            util.extend(insOpt[prop], funcOrObject(options, prop), funcOrObject(opt, prop))

        })
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

    // inherit Compile
    var vm = this
    var el = options.el
    var components = [gcomps, options.components || {}]
    var directives = allDirectives.concat([options.directives || {}])
    /**
     *  get component define by tagName
     */
    vm.$component = getComponent
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
    vm.$el = el

    /**
     *  assign methods
     */
    var methods = vm.$methods = options.methods
    util.objEach(methods, function(k, v) {
        vm[k] = v
    })

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

    if (options.$data) {
        $data = options.$data
        // if state model instance passsing, call after set
        options.created && options.created()
    } else {
        // Call before vm-$data instance
        options.created && options.created()

        util.merge(dataOpt, funcOrObject(options, 'data'))
        // Instance observable state model

        var mopts = {
            deep: true,
            props: dataOpt,
            computed: options.computed
        }
        $data = new Mux(mopts)
    }

    /**
     *  DOM Compile
     *  @TODO the unique interface for a compiled node($el, $remove)
     */
    vm.$compile = function (el, scope) {
        var compiler
        util.walk(el, function (node) {
            var isRoot = node === el
            var result = compile(node, scope, isRoot)

            if (isRoot) compiler = result.inst
            return result.into
        })
        return compiler
    }

    vm.$compiler = vm.$compile(el)

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
                if (inst = compileBlock(node, scope, isRoot)) {
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
                if (compileComponent(node, vm, scope, isRoot)) {
                    inst = new Compiler(node)
                    into = false
                    break
                }
                break
            case 3:
                inst = new TextDirective(vm, scope, node)
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
            inst: inst || new Compiler(node)
        }
    }


    /**
     *  Call ready after compile
     */
    options.ready && options.ready.call(vm)
    /**
     *  Reverse component Constructor by tagName
     */
    function getComponent(tn) {
        var compDef
        components.some(function (comp) {
            var cid = tn.toLowerCase()
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
    function compileBlock(node, scope, isRoot) {
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
                        conf.namespace + 'if', 
                        $(node).attr('is')
                )
                if (!isRoot) {
                    inst.mount(node, true)
                }
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
                        conf.namespace + 'repeat', 
                        $(node).attr('items')
                )
                if (!isRoot) {
                    inst.mount(node, true)
                }
                return inst
        }
    }

    /**
     *  comment
     */
    function compileComponent (node, parentVM, scope) {
        var Comp = getComponent(node.tagName)

        /**
         *  Tag is not a custom element
         */
        if (!Comp) return

        // need deep into self
        if (node === parentVM.$el) return

        var binding = $(node).attr('state')
        var _isExpr = util.isExpr(binding)
        var bindingData = _isExpr ? Compiler.execute(parentVM, scope, binding) : {}

        var methods = $(node).attr('method')
        var bindingMethods = util.isExpr(methods) ? Compiler.execute(parentVM, scope, methods) : {}

        /**
         *  Watch
         */
        var sep = ','
        function parseExpr (expr) {
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
        function setBindingObj (expr) {
            var r = parseExpr(expr)
            ast[r.name] = r
            ;(r.vars || []).forEach(function (v) {
                revealAst[v] = r.name
            })
        }

        var ast = {}
        var revealAst = {}
        var compVM

        binding = _isExpr ? Compiler.stripExpr(binding) : ''

        if (binding) {
            if (binding.match(sep)) {
                binding.split(sep)
                       .match(sep)
                       .map(setBindingObj)
            } else {
                setBindingObj(binding)
            }
        }

        compVM = new Comp({
            el: node,
            data: bindingData,
            methods: bindingMethods,
            $parent: parentVM
        })

        // watch and binding
        if (binding) {
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
        return compVM
    }

    /**
     *  Compile attributes to directive
     */
    function compileDirective (node, scope) {
        var value = node.nodeValue
        var attrs = [].slice.call(node.attributes)
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
            } else if (aname.indexOf(conf.namespace) === 0) {
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
            new AttributeDirective(vm, scope, node, name, value)
        })

        /**
         *  Directives binding
         */
        directives.forEach(function(group) {
            util.objEach(group, function(id, def) {
                var dirName = conf.namespace + id
                var expr = ast.dires[dirName]
                if (ast.dires.hasOwnProperty(dirName)) {
                    new Directive(vm, scope, node, def, dirName, expr)
                }
            })
        })
    }
}

module.exports = Zect
