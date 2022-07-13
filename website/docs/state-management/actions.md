---
sidebar_position: 3
---

# Actions

Allows multiple updates in one operation.

### Without action

Recalculation occurs after each change in the observed value.

```tsx
import { observable, computed, autorun } from 'whatsup'

const firstName = observable('John')
const lastName = observale('Lennon')

const fullName = computed(() => `${firstName()} ${lastName()}`)

const updateName = (first: string, last: string) => {
    firstName(first)
    lastName(last)
}

autorun(() => console.log(fullName))
//> 'John Lennon'

updateName('Barry', 'Miller')
//> 'Barry Lennon' <-- recalculation after change firstName
//> 'Barry Miller' <-- recalculation after change lastName
```

### With action

Recalculation occurs once after all changes

```tsx
import { observable, computed, action, autorun } from 'whatsup'

const firstName = observable('John')
const lastName = observale('Lennon')

const fullName = computed(() => `${firstName()} ${lastName()}`)

const updateName = action((first: string, last: string) => {
    firstName(first)
    lastName(last)
})

autorun(() => console.log(fullName))
//> 'John Lennon'

updateName('Barry', 'Miller')
//> 'Barry Miller' <-- once recalculation after change firstName & lastName
```

### runInAction

runInAction creates an action and immediately executes it

```tsx
import { observable, computed, runInAction, autorun } from 'whatsup'

const firstName = observable('John')
const lastName = observale('Lennon')

const fullName = computed(() => `${firstName()} ${lastName()}`)

autorun(() => console.log(fullName))
//> 'John Lennon'

runInAction(() => {
    firstName('Barry')
    lastName('Miller')
})
//> 'Barry Miller' <-- once recalculation after change firstName & lastName
```
