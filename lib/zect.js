var $ = require('./dm')
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
var directives = require('./directives')(Zect)  // preset directives getter
var elements = require('./elements')(Zect)      // preset directives getter
var allDirectives = [directives, {}]                // [preset, global]
var gdirs = allDirectives[1]
var gcomps = {}                                 // global define components
var componentProps = ['binding']

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
        // merge data property
        insOpt.data = {}
        util.extend(insOpt.data, funcOrObject(options, 'data'), funcOrObject(opt, 'data'))

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
          UTILS
*******************************/
function isElement(el) {
    return el instanceof HTMLElement || el instanceof DocumentFragment
}
function isIfSyntax(tn) {
    return tn == (conf.namespace + 'if').toUpperCase()
}
function isRepeatSyntax(tn) {
    return tn == (conf.namespace + 'repeat').toUpperCase()
}

/*******************************
      ViewModel Constructor
*******************************/
function ViewModel(options) {
    // inherit Compile
    var vm = this
    var el = options.el
    var components = [gcomps, options.components || {}]
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
    } else if (!isElement(el)) {
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
            var result = compile(node, scope)
            if (node === el) compiler = result.inst
            return result.into
        })
        return compiler
    }

    vm.$compiler = vm.$compile(el, {
        root: el
    })

    function compile (node, scope) {
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
                if (inst = compileBlock(node, scope)) {
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
                if (compileComponent(node, vm, scope)) {
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
    function compileBlock(node, scope) {
        var tagName = node.tagName
        switch(true) {
            /**
             *  <*-if></*-if>
             */
            case isIfSyntax(tagName):
                return new ElementDirective(
                        vm, 
                        scope,
                        node, 
                        elements['if'], 
                        conf.namespace + 'if', 
                        $(node).attr('is')
                )
            /**
             *  <*-repeat></*-repeat>
             */
            case isRepeatSyntax(tagName):
                return new ElementDirective(
                        vm, 
                        scope,
                        node, 
                        elements['repeat'],
                        conf.namespace + 'repeat', 
                        $(node).attr('items')
                )
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
        if (!Comp) return false
        // need deep into self
        if (node === parentVM.$el) return

        var binding = $(node).attr('binding')
        var bindingData = Compiler.execute(parentVM, scope, binding)

        /**
         *  Watch
         */
        var multiSep = ','
        if (binding.match(multiSep)) {
            var parts = binding.split(multiSep)
            binding.split(multiSep).map(function(expr) {
                // do with single
                var propertyName
                expr = expr.replace(/^[^:]+:/, function (m) {
                    propertyName = m.replace(/:$/, '').trim()
                    return ''
                }).trim()
            })
        }


        new Comp({
            el: node,
            data: bindingData,
            $parent: parentVM
        })
        return true
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
        allDirectives.forEach(function(d) {
            util.objEach(d, function(id, def) {
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
