---
sidebar_position: 5
---

# Mutators

### Mutate previos value

Allows you to create new data based on previous.

```tsx
import { observable, computed, autorun } from 'whatsup'

const increment = (prev = 0) => prev + 1

const timer = computed(function* () {
    const counter = observable(0)

    setInterval(() => counter(increment), 1000)

    while (true) {
        yield counter()
    }
})

autorun(() => console.log(output()))

// 0
// 1
// 2
```
