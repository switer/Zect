var $ = require('./dm')
var Mux = require('./mux')
var util = require('./util')
var conf = require('./conf')
var Directive = require('./directive')

/**
 *  private vars
 */
var preset = require('./preset') // preset directives getter
var directives = [null, {}] // [preset, global]
var gdirs = directives[1]

/**
 *  Global API
 */
function Zect(options) {
    return ViewModel.call(this, options || {})
}
Zect.extend = function(options) {
    return function() {
        _insertProto(this, Zect.prototype)
        return ViewModel.call(this, options || {})
    }
}
Zect.directive = function(id, definition) {
    gdirs[id] = definition
}
Zect.namespace = function(n) {
    conf.namespace = n
}


function ViewModel(options) {
    var proto = this.__proto__
    var vm = this
    var el = options.el

    /**
     *  Mounted element detect
     */
    if (!el && options.template) {
        el = document.createElement('div')
        el.innerHTML = options.template
    } else if (util.type(el) == 'string') {
        el = document.querySelector(el)
    } else if (!(el instanceof HTMLElement)) {
        throw new Error('Unmatch el option')
    }
    vm.$el = el

    /**
     *  assign methods
     */
    var methods = options.methods
    util.objEach(methods, function(k, v) {
        vm[k] = v
    })

    var $data
    if (options.$data) {
        $data = options.$data
    } else {
        /**
         *  Init state model
         */
        var mopts = {
            deep: true,
            props: options.data,
            computed: options.computed
        }
        var $data = new Mux(mopts)
    }
    Object.defineProperty(vm, '$data', {
        enumerable: true,
        get: function() {
            return $data
        },
        set: function(v) {
            $data.$set(v)
        }
    })


    var exprReg = /^\{.*?\}&/
    util.walk(el, function(n) {
        var type = n.nodeType // 1. ELEMENT_NODE; 2. ATTRIBUTE_NODE; 3. TEXT_NODE; 8. COMMENT_NODE; 9. DOCUMENT_NODE 
        var value = n.nodeValue
        var name = n.tagName

        switch (type) {
            case 1:
                if (isComponent(name)) {
                    // child component
                    new Zect({
                        el: n,
                        $parent: vm
                    })
                } else {

                    var attrs = n.attributes
                    var ast = {
                        varAttName: {},
                        directives: {},
                        expression: {}
                    }
                    for (var i = 0; i < attrs.length; i++) {
                        var att = attrs[i]
                        var n = att.name
                        var v = att.value
                        // parse att
                        if (n.match(match(exprReg))) {
                            // variable attribute name
                            ast.varAttName[n] = v
                        } else if(n.indexOf(conf.namespace == 0)) {
                            // directive
                            ast.directives[n] = v
                        } else if(v.trim().match(exprReg)) {
                            // named attribute with expression
                            ast.expression[n] = v
                        }
                    }

                    /**
                     *  parse attributes to directive
                     */
                    function compile (ast) {
                        directives.objEach(function(d) {
                            util.objEach(d, function(id, def) {
                                if(vm.$el.contains(n)) return false
                                if (ast.directives[id]) {
                                    new Directive(vm, n, id, def)
                                }
                            })
                        })
                    }

                    /**
                     *  'xx {title} sss' -- > xx zect.js sss
                     */
                    function compileCtn (n) {
                        var childs = n.childNodes
                        for (var i = 0; i < childs.length; i ++) {
                            var c = childs[i]
                            if (c.nodeType == 3) {
                                var v = c.nodeValue
                                // parse text node only
                                v = v.replace(/\\{/g, '\uFFF0').replace(/\\}/g, '\uFFF1')
                                // extract vars
                                var exprs = v.match(/({[\s\S]*?})/)

                            }
                        }
                    }
                    
                }

                break
            case 3:
                break
            default:
                return false
        }
    }.bind(this))


    /**
     *  Directive bindings
     */
    // directives[0] = preset(Zect) // set preset directives

    // directives.forEach(function(d) {
    //     util.objEach(d, function(id, def) {
    //         parseDirective(vm, id, def)
    //     })
    // })

    /**
     *  Life cycle methods
     */
    options.ready && options.ready.call(vm)
}

var definition = {}
function extractExp(node) {
    var attrs = node.attributes
    for (var i = 0; i < attrs.length; i ++) {
        var name = attrs[i].name
        var value = attrs[i].value
        if (name.match(/[\w]-[\w]/)) {

        } else if (value.match(/^\s*\{.*?\}\s*$/)) {
            new Directive(vm, node, name, {
                bind: function () {
                    return []
                },
                update:function () {

                }
            })
        }
    }
}

function parseDirective(vm, id, definition) {
    var atn = conf.namespace + id
        /**
         *  using selector to parse declare syntax
         */
    vm.$el.hasAttribute(atn) && new Directive(vm, vm.$el, atn, definition)

    $(vm.$el).find('[' + atn + ']').each(function(tar) {
        if (!vm.$el.contains(tar)) return
        new Directive(vm, tar, atn, definition)
    })
}


/**
 *  utils
 */
function _insertProto(obj, proto) {
    var end = obj.__proto__
    obj.__proto__ = proto
    obj.__proto__.__proto__ = end
}

module.exports = Zect
