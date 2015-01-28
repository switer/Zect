'use strict';

var $ = require('./dom')
var util = require('./util')

module.exports = function(Zect) {
    return {
        'repeat': {
            bind: function(wkey) {
                var $el = $(this.tar)
                this.$parent = $el.parent()
                $el.remove()
                return [wkey]
            },
            update: function(items) {
                if (!items) return
                this.$parent.html('')
                var that = this
                var frag = document.createDocumentFragment()
                items.forEach(function(item, index) {
                    var $subEl = that.tar.cloneNode()
                    var $data = util.type(item) == 'object' ? item : {}

                    $data.$index = index
                    $data.$value = item
                    var subVM = new Zect({
                        el: $subEl,
                        data: $data
                    })
                    subVM.$parentVM = that.vm
                    
                    frag.appendChild($subEl)
                })
                this.$parent.append(frag)
            }
        },
        'html': {
            bind: function(wkey) {

                return [wkey] // those dependencies need to watch
            },
            update: function(next) {

                $(this.tar).html(next)
            }
        },
        'attr': {
            bind: function(wkey, attname) {
                this.attname = attname
                return [wkey] // those dependencies need to watch
            },
            update: function(next) {
                if (!next && next !== '') {
                    $(this.tar).removeAttr(this.attname)
                } else {
                    $(this.tar).attr(this.attname, next)

                }
            }
        }
    }
}
