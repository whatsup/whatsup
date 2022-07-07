---
sidebar_position: 1
---

# Introduction

## What is it?

Whatsup is a modern frontend framework with JSX components based on pure functions and generators. It has its own reactivity system with high performance.

## Your first stateless component

```tsx
function App() {
    return <div>Hello World</div>
}
```

Yes, we can render without a container, directly to the body

## Your first stateful component

```tsx
function* App() {
    const counter = observable(0)

    while (true) {
        const count = counter()
        const onClick = () => counter(count + 1)

        yield (
            <div>
                <p>You click {count} times</p>
                <button onClick={onClick}>Click me</button>
            </div>
        )
    }
}
```

Yes, we use generators to store local state
