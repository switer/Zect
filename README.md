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
    * [Zect.namespace(namespace)]()
    * [Zect.directive(id, definition)]()

- Instance Options
    * [el]()
    * [template]()
    * [data]()
    * [computed]()

- Instance Methods

- Direcitves
    * [html]()
    * [attr]()

## License

MIT
