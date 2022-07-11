---
sidebar_position: 2
---

# Computeds

Creates a derived field. Accepts a function or generator as an argument.

### Simple computed field

```tsx
import { computed, autorun } from 'whatsup'

const firstName = observable('John')
const lastName = observale('Lennon')

const fullName = computed(() => `${firstName()} ${lastName()}`)

autorun(() => console.log(fullName))
//> 'John Lennon'

firstName('Barry')
//> 'Barry Lennon'
```

### Computed based on generator

The generator allows you to create a computed field with its own internal state and the `try catch finally` construction allows you to handle errors and execute the code when there are no subscribers left.

```tsx
import { computed, autorun } from 'whatsup'

const timer = computed(function* () {
    const counter = observable(0)
    const timerId = setInterval(() => counter(counter() + 1), 1000)

    try {
        while (true) {
            yield counter()
        }
    } finally {
        clearInterval(timerId)
        console.log('Timer stopped')
    }
})

const dispose = autorun(() => console.log(timer()))
//> 0
//> 1
//> 2

dispose()
//> 'Timer stopped'
```
