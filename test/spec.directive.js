'use strict';

describe('#Directive', function () {
	it('attr', function () {
		var app = new Zect({
			template: '<z-template class="att" z-attr="{attName: attValue}"></z-template>',
			data: function () {
				return {
					attValue: ''
				}
			}
		})	
		assert(app.$el.hasAttribute('attName'))
		assert.equal(app.$el.getAttribute('attName'), '')
		app.$data.attValue = 'v'
		assert.equal(app.$el.getAttribute('attName'), 'v')
		app.$data.attValue = null
		assert.equal(app.$el.getAttribute('attName'), 'null')
		// app.$data.attValue = undefined
		// assert(!app.$el.hasAttribute('attName'))
	})
})