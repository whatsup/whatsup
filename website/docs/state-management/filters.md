---
sidebar_position: 7
---

# Filters

Filters can be used to control how updates are propagated. The filter receives a new value and must return true or false. If the filter returns false, update propagation stops.

```tsx
import { observable, computed, filter, autorun } from 'whatsup'

const timer = computed(function* () {
    const counter = observable(0)
    const timerId = setInterval(() => counter(counter() + 1), 1000)

    while (true) {
        yield counter()
    }
})

// Define a filter that passes only even values
const even = filter((next: number) => next % 2 === 0)

const evenTimer = computed(() => even(timer()))

autorun(() => console.log(evenTimer()))
//> 0
//> 2
//> 4
//> ...
```
