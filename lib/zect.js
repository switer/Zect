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
var preset = require('./preset') // preset directives getter
var directives = [preset(Zect), {}] // [preset, global]
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
Zect.namespace = function(ns) {
    conf.namespace = ns
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
    var methods = vm.$methods = options.methods
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

    /**
     *  Component tag detect
     */
    function isComponent() {
        // TODO
    }

    var exprReg = /^\{.*?\}&/

    util.walk(el, function(node) {
        var type = node.nodeType // 1. ELEMENT_NODE; 2. ATTRIBUTE_NODE; 3. TEXT_NODE; 8. COMMENT_NODE; 9. DOCUMENT_NODE 
        var value = node.nodeValue
        var tagName = node.tagName

        switch (type) {
            case 1:
                if (isComponent(tagName)) {
                    // child component
                    new Zect({
                        el: node,
                        $parent: vm
                    })
                    return false
                } else {
                    var attrs = node.attributes
                    var ast = {
                        attributes: {},
                        directives: {}
                    }
                    /**
                     *  attributes walk
                     */
                    for (var i = 0; i < attrs.length; i++) {
                        var att = attrs[i]
                        var aname = att.name
                        var v = att.value
                        var removed
                        // parse att
                        if (aname.match(exprReg)) {
                            // variable attribute name
                            ast.attributes[aname] = v
                            removed = true
                        } else if(aname.indexOf(conf.namespace) === 0) {
                            // directive
                            ast.directives[aname] = v
                            removed = true
                        } else if(v.trim().match(exprReg)) {
                            // named attribute with expression
                            ast.attributes[aname] = v
                            removed = true
                        }
                        removed && node.removeAttribute(aname)
                    }

                    /**
                     *  Attributes binding
                     */
                    util.objEach(ast.attributes, function (name, value) {
                        new AttributeDirective(vm, node, name, value)
                        node.removeAttribute(name)
                    })

                    /**
                     *  Directives binding
                     */
                    directives.forEach(function(d) {
                        util.objEach(d, function(id, def) {
                            var dirName = conf.namespace + id
                            var expr = ast.directives[dirName]

                            if (ast.directives.hasOwnProperty(dirName)) {
                                new Directive(vm, node, def, dirName, expr)
                            }
                        })
                    })
                }
                break
            case 3:
                new TextDirective(vm, node)
            default:
                return false
        }
    }.bind(this))

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
