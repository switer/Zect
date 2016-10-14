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
	})
	it('attr:multiple', function () {
		var app = new Zect({
			template: '<z-template class="att" z-attr="{\'attName1 attName2\': attValue}"></z-template>',
			data: function () {
				return {
					attValue: ''
				}
			}
		})	
		assert(app.$el.hasAttribute('attName1'))
		assert(app.$el.hasAttribute('attName2'))
		assert.equal(app.$el.getAttribute('attName1'), '')
		assert.equal(app.$el.getAttribute('attName2'), '')
		app.$data.attValue = 'v'
		assert.equal(app.$el.getAttribute('attName1'), 'v')
		assert.equal(app.$el.getAttribute('attName2'), 'v')
		app.$data.attValue = null
		assert.equal(app.$el.getAttribute('attName1'), 'null')
		assert.equal(app.$el.getAttribute('attName2'), 'null')
	})
	it('class:multiple', function () {
		var app = new Zect({
			template: '<z-template class="att" z-class="{\'class1 class2 \': addClass}"></z-template>',
			data: function () {
				return {
					addClass: false
				}
			}
		})
		assert.equal(app.$el.className, 'att')
		app.$data.addClass = true
		assert.equal(app.$el.className, 'att class1 class2')
	})
})