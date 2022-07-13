![](https://habrastorage.org/webt/nq/a0/ad/nqa0ad37k4ftra_f_oypmomzpuy.png)

## What is it?

Whatsup is a modern frontend framework with own reactivity system and JSX components based on pure functions and generators.

### Features

-   🎉 easy to use: simple api, just write code
-   🚀 own reactivity system with high performance
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

You can find the Whatsup documentation on the [website](https://whatsup.github.io).

Check out the [Intro page](https://whatsup.github.io/docs/intro/) for a quick overview.

The documentation is divided into several sections:

-   [Introduction](https://whatsup.github.io/docs/intro/)
-   [Getting Started](https://whatsup.github.io/docs/getting-started)
-   [Componetns](https://whatsup.github.io/docs/components/)
-   [State management](https://whatsup.github.io/docs/state-management/)
-   [Styling](https://whatsup.github.io/docs/styling/)

### License

[MIT](https://opensource.org/licenses/MIT) (c) 2020-present, [@iminside](https://github.com/iminside)
