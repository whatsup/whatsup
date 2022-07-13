---
sidebar_position: 3
---

# Valid JSX elements

Whatsup can display almost everything! This means that your components can return strings, numbers, booleans, JSX components, arrays of those values, and even arrays of arrays of arrays :)

```tsx
function App() {
    return null
    return true
    return false
    return 'str'
    return 1
    return <div />
    return ['str', 'str']
    return [1, 1, 1]
    return [<div />, <div />]
    return [
        [<div />, <div />],
        [<div />, <div />],
    ]
}
```

Just remember that in arrays, it is desirable to specify the key property for the JSX elements
