---
sidebar_position: 3
---

# Components

Whatsup components use regular functions for stateless components and generators for stateful components.

Each component is an atom of a reactive system, automatically keeping track of its dependencies and applying changes in the most evvective way.

## Your first stateless component

```tsx
import { render } from 'whatsup/jsx'

function App() {
    return <div>Hello World</div>
}

render(<App />)
```

Yes, we can render without a container, directly to the body

## Your first stateful component

```tsx
import { render } from 'whatsup/jsx'

function* App() {
    const counter = observable(0)
    const handleClick = () => counter(counter() + 1)

    while (true) {
        yield (
            <div>
                <p>You click {counter()} times</p>
                <button onClick={handleClick}>Click me</button>
            </div>
        )
    }
}

render(<App />)
```

Yes, we use generators to store local state
