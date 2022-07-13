---
sidebar_position: 1
---

# Introduction

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
