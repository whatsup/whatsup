![](https://raw.githubusercontent.com/whatsup/whatsup.github.io/master/assets/images/readme.png)

## What is it?

Whatsup is a modern frontend framework with own reactivity system and JSX components based on pure functions and generators.

### Features

-   🎉 easy to use: simple api, just write code
-   🚀 own reactivity system with high performance
-   🌈 cool styling system based on css modules
-   ⛓ glitch free, autotracking and updating of dependencies
-   🚦 written in typescript, type support out of the box
-   🗜 small size: ~6kB gzipped (state management + jsx components)

### Example

```tsx
import { observable } from 'whatsup'
import { render } from 'whatsup/jsx'

function* App() {
    const counter = observable(0)
    const increment = () => counter(counter() + 1)

    while (true) {
        yield (
            <div>
                <p>You click {counter()} times</p>
                <button onClick={increment}>Click me</button>
            </div>
        )
    }
}

render(<App />)
```

### Documentation

You can find the Whatsup documentation on the [website](https://whatsup.js.org).

Check out the [Intro page](https://whatsup.js.org/docs/intro/) for a quick overview.

The documentation is divided into several sections:

-   [Introduction](https://whatsup.js.org/docs/intro/)
-   [Getting Started](https://whatsup.js.org/docs/getting-started)
-   [Components](https://whatsup.js.org/docs/components/)
-   [State management](https://whatsup.js.org/docs/state-management/)
-   [Styling](https://whatsup.js.org/docs/styling/)

### Examples

-   [Todos MVC](http://examples.whatsup.js.org/todos)
-   [Async loaders](http://examples.whatsup.js.org/loadable)
-   [Sierpinski triangle](http://examples.whatsup.js.org/sierpinski)

### License

[MIT](https://opensource.org/licenses/MIT) (c) 2020-present, [@iminside](https://github.com/iminside)
