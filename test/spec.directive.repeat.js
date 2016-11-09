describe('#Directives/repeat', function () {
  it('repeat', function () {
    var app = new Zect({
      data: function () {
        return {
          items: [{id: 1, name: '1'}, {id: 2, name: '2'}]
        }
      },
      template: tools.template(function () {/*
        <z-repeat items="{items}">
          <div data-id="{id}">{name}</div>
        </z-repeat>
      */})
    })
    var $items = app.$el.querySelectorAll('[data-id]')
    expect($items.length).to.equal(2)
    /**
     * delta update
     */
    app.$data.items[0].id = 3
    app.$data.items[1].id = 4
    var $nextItems = app.$el.querySelectorAll('[data-id]')
    expect($items[0]).to.equal($nextItems[0])
    expect($items[1]).to.equal($nextItems[1])
    expect($items[0].dataset.id).to.equal('3')
    expect($items[1].dataset.id).to.equal('4')
  })
  it('repeat:x2', function () {
    var app = new Zect({
      data: function () {
        return {
          items: [[{id: 1, name: '1'}, {id: 2, name: '2'}]]
        }
      },
      template: tools.template(function () {/*
        <z-repeat items="{items}">
          <ul>
          <z-repeat items="{$value}">
            <li data-id="{id}">{name}</li>
          </z-repeat>
          </ul>
        </z-repeat>
      */})
    })
    var $uls = [].slice.call(app.$el.querySelectorAll('ul'))
    var $lis = [].slice.call(app.$el.querySelectorAll('ul li'))
    expect($uls.length).to.equal(1)
    expect($lis.length).to.equal(2)
    /**
     * delta update
     */
    // app.$data.items[0][0].id = 3
    app.$data.items[0][1].id = 4
    var $nextUls = app.$el.querySelectorAll('ul')
    var $nextLis = app.$el.querySelectorAll('ul li')
    expect($uls[0]).to.equal($nextUls[0])
    expect($lis[0]).to.equal($nextLis[0])
    expect($lis[1]).to.equal($nextLis[1])
    expect($nextLis[1].dataset.id).to.equal('4')

    /**
     * delta update item
     */
    app.$data.$set('items[0][1]', {id: 5, name: '5'})
    $nextLis = app.$el.querySelectorAll('ul li')
    expect($lis[0]).to.equal($nextLis[0])
    expect($lis[1]).to.equal($nextLis[1])
    expect($nextLis[1].dataset.id).to.equal('5')

    /**
     * array.shift()
     */
    app.$data.items[0].shift()
    $nextLis = app.$el.querySelectorAll('ul li')
    assert.notEqual($lis[0], $nextLis[0])
    assert.equal($nextLis.length, 1)
    assert.equal($nextLis[0].dataset.id, '5')

    /**
     * array.splice()
     */
    app.$data.items[0].splice(0, 0, {id: 2, name: '2'})
    $nextLis = app.$el.querySelectorAll('ul li')
    assert.equal($nextLis.length, 2)
    assert.equal($nextLis[0].dataset.id, '2')
  })
  it('repeat:diff', function () {
    var app = new Zect({
      data: function () {
        return {
          items: [[{id: 0, name: '0'}, {id: 1, name: '1'}, {id: 2, name: '2'}]]
        }
      },
      template: tools.template(function () {/*
        <z-repeat items="{items}">
          <ul>
          <z-repeat items="{$value}">
            <li data-id="{id}">{name}</li>
          </z-repeat>
          </ul>
        </z-repeat>
      */})
    })
    var $uls = [].slice.call(app.$el.querySelectorAll('ul'))
    var $lis = [].slice.call(app.$el.querySelectorAll('ul li'))
    assert.equal($uls.length, 1)
    assert.equal($lis.length, 3)
    // diff update
    app.$data.$set('items[0]', [{
            id: 1,
            name: '1'
        }, {
            id: 2,
            name: '2'
        }])
        var $nextLis = [].slice.call(app.$el.querySelectorAll('ul li'))
    assert.equal($nextLis.length, 2)
    assert.equal($nextLis[0], $lis[1])
    assert.equal($nextLis[1], $lis[2])
  })
  it('repeat:reused', function () {
    /**
     * and test recycled
     */
    var app = new Zect({
      data: function () {
        return {
          items: [1,2,3,4]
        }
      },
      template: tools.template(function () {/*
        <ul>
          <z-repeat items="{items}">
            <li>{$value}</li>
          </z-repeat>
        </ul>
      */})
    })

    var $lis = [].slice.call(app.$el.querySelectorAll('ul li'))
    app.$data.items = [4,5,3,6]
    var $nextLis = [].slice.call(app.$el.querySelectorAll('ul li'))

    assert.equal($nextLis[0], $lis[3]) // moved
    assert.equal($nextLis[1], $lis[1]) // updated
    assert.equal($nextLis[2], $lis[2]) // reused
    assert.equal($nextLis[3], $lis[0]) // recycled

    assert.equal($nextLis[0].innerHTML, 4)
    assert.equal($nextLis[1].innerHTML, 5)
    assert.equal($nextLis[2].innerHTML, 3)
    assert.equal($nextLis[3].innerHTML, 6)
  })
  it('repeat:destroy', function () {
    /**
     * and test recycled
     */
    var app = new Zect({
      data: function () {
        return {
          items: [1,2,3,4]
        }
      },
      template: tools.template(function () {/*
        <z-repeat items="{to2d(items)}">
          <ul>
            <z-repeat items="{$value}">
              <li>{$value}</li>
            </z-repeat>
          </ul>
        </z-repeat>
      */}),
      methods: {
        to2d: function (list) {
          var next = []
          list = list.slice(0)
          while(list.length) {
            next.push(list.splice(0, 2))
          }
          return next
        }
      }
    })
    app.$data.items = []
    assert.equal(app.$el.querySelectorAll('ul li').length, 0) // moved
  })
  it('repeat:ref', function () {
    var app = new Zect({
      data: function () {
        return {
          items: [1,2,3,4]
        }
      },
      template: tools.template(function () {/*
        <z-repeat items="{items}" ref="repeat">
          <div>{$value}</div>
        </z-repeat>
      */})
    })
    assert.equal(app.$refs.repeat.$itemBindings(0)[0].$expr, '{$value}') // moved
  })
  it('repeat:nested-variables', function () {
    var app = new Zect({
      template: tools.template(function () {/*
        <z-repeat items="{list}">
              <z-repeat items="{_items}">
                  <z-repeat items="{_values}">
                      <div>{$parent.$parent.$index}.{$parent.$index}.{$value}</div>
                  </z-repeat>
              </z-repeat>
        </z-repeat>
      */}),
      data: function () {
        return {
          list: [{_items: [{_values: [1]}]}]
        }
      }
    })
    assert.equal(app.$el.children[0].innerHTML, '0.0.1')
  })
})