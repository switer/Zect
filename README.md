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
    * [Zect.component()]() // TBD
    * [Zect.namespace(namespace)]()
    * [Zect.directive(id, definition)]()

- Instance Options
    * [el]()
    * [data]()
    * [template]()
    * [computed]()
    * [directives]() // TBD
    * [components]() // TBD

- Instance Methods
    * [$set]() // TBD
    * [$get]() // TBD

- Direcitves

    * [if]()
    * [on]()
    * [show]()
    * [attr]()
    * [html]() // TBD: syntax sugar
    * [class]() // TBD
    * [style]() // TBD
    * [width]() // TBD
    * [repeat]()
    * [component]() // TBD


## Guide
- **Custom Directive**

Options's Methods: `exp`, `bind`, `update`. `exp` is optional. Example below:

```js
Zect.directive('', {
    exp: function (exp) {
        // parse directive's attribute value to key
        return [exp.split(':')[0], exp.split(':')[1]]
    },
    bind: function (key1, key2) {
        // do something
        return [key2] // keys that need to watch changes
    },
    update: function (value) {
        // do some with state
    }
})
```

## License

MIT
