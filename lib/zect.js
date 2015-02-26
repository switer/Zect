var $ = require('./dm')
var Mux = require('./mux')
var util = require('./util')
var conf = require('./conf')
var Directive = require('./directive')
var AttributeDirective = Directive.Attribute
var TextDirective = Directive.Text

/**
 *  private vars
 */
var preset = require('./preset')(Zect) // preset directives getter
var directives = [preset, {}] // [preset, global]
var gdirs = directives[1]
var gcomps = {} // global define components
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
    // var proto = this.__proto__
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
     */
    vm.$compile = function (el, deep) {
        if (deep) {
            util.walk(el, compile)
        } else {
            compile(el)
        }
    }

    vm.$compile(el, true)


    /**
     *  Call ready after compile
     */
    options.ready && options.ready.call(vm)

    /**
     *  @closure vm
     */
    function compile(node) {
        /**
         *  1. ELEMENT_NODE; 
         *  2. ATTRIBUTE_NODE; 
         *  3. TEXT_NODE; 
         *  8. COMMENT_NODE; 
         *  9. DOCUMENT_NODE; 
         *  11. DOCUMENT_FRAGMENT;
         */
        switch (node.nodeType) {
            case 1:
                if (compileBlock(node) !== false) 
                    return false
                else {
                    compileDirective(node)
                }

                if (!vm.$el.contains(node) || compileComponent(node, vm)) {
                    return false
                }
                break
            case 3:
                new TextDirective(vm, node)
                break
            case 11:
                // document fragment
                break
            default:
                return false
        }
    }
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
    function compileBlock(node) {
        var tagName = node.tagName

        switch(true) {
            /**
             *  <*-if></*-if>
             */
            case isIfSyntax(tagName):
                new Directive(
                        vm, 
                        node, 
                        preset['blockif'], 
                        conf.namespace + 'blockif', 
                        $(node).attr('is')
                )
                break
            /**
             *  <*-repeat></*-repeat>
             */
            case isRepeatSyntax(tagName):
                var tar = node.firstElementChild
                $(node).replace(tar)
                new Directive(
                        vm, 
                        tar, 
                        preset['repeat'], 
                        conf.namespace + 'if', 
                        $(node).attr('items')
                )
                break
            default:
                return false
        }
    }

    /**
     *  comment
     */
    function compileComponent (node, parentVM) {
        var Comp = getComponent(node.tagName)
        /**
         *  Tag is not a custom element
         */
        if (!Comp) return false
        // need deep into self
        if (node === parentVM.$el) return

        new Comp({
            el: node,
            $parent: parentVM
        })
        return true
    }

    /**
     *  Compile attributes to directive
     */
    function compileDirective (node) {
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
            new AttributeDirective(vm, node, name, value)
        })

        /**
         *  Directives binding
         */
        directives.forEach(function(d) {
            util.objEach(d, function(id, def) {
                var dirName = conf.namespace + id
                var expr = ast.dires[dirName]
                if (ast.dires.hasOwnProperty(dirName)) {
                    new Directive(vm, node, def, dirName, expr)
                }
            })
        })
    }
}

module.exports = Zect
