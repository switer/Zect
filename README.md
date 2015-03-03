Zect
====

DOM's manipulation should be automatically when state change.Zect make reactive UI easy.
**Zect**'s state tracking is power by [muxjs](https://github.com/switer/muxjs)

## Usage
- [zect.js](https://raw.githubusercontent.com/switer/zect/master/dist/zect.js)
- [zect.min.js](https://raw.githubusercontent.com/switer/zect/master/dist/zect.min.js)

```html
<script src="dist/zect.js"></script>
<!-- mounted element -->
<div id="app">
    <span z-html="title"></span>
</div>
```
Define and instance

```js
var app = new Zect({
    el: '#app',
    data: function () {
        return {
            title: 'Hello, Zect'
        }
    }
})
```

## API Reference
- Global API
    * [Zect()]()
    * [Zect.extend()]()
    * [Zect.component()]()
    * [Zect.namespace(namespace)]()
    * [Zect.directive(id, definition)]()

- Instance Options
    * [el]()
    * [data]()
    * [methods]()
    * [template]()
    * [computed]()
    * [directives]()
    * [components]()

- Instance Methods
    * [$set]()
    * [$get]()

- Template Syntax
    * [if]()
    * [repeat]()
    * [{expression}]()

- Direcitves
    * [on]()
    * [ref]()
    * [show]()
    * [attr]()
    * [class]()
    * [style]()
    * [component]() // TBD


## Guide
- **Custom Directive**

Options's Methods: `bind`, `update`, 'unbind'. `update`, `unbind` is optional. Example below:

```html
<div z-tap="{onClick}"></div>
```

```js
Zect.directive('tap', {
    bind: function (fn, expr) {
        // do something when init bind
    },
    update: function (fn) {
        // do some with state change or init
    }
})
```

- **Two Binding**

```html
<input type="text" z-on="{change: onChange}" id="con" v-model="search" />
```

```js
Zect.directive('model', {
    bind: function (state) {
        this.vm.$data.$watch(function)
    }
})
new Zect({
    el: '#con',
    data: {
        search: ''
    },
    ready: function () {
        
    },
    methods: {
        onChange: function (e) {
            
        }
    }
})
```

## License

MIT
