---
sidebar_position: 4
---

# Observable props

You can pass `observables` and `computeds` directly to element properties. Whatsup will automatically extract their values and track changes. This functionality allows you to make updates without re-rendering components.

```tsx
function App() {
    const className = observable<'red' | 'green'>('red')
    const handleClick = () => {
        const newValue = className() === 'red' ? 'green' : 'red'
        className(newValue)
    }

    while (true) {
        yield(
            <button className={className} onClick={handleClick}>
                Click me
            </button>
        )
    }
}

render(<App />)
```

When you click on the button, Whatsup will update the className property without re-rendering the <App /> component
