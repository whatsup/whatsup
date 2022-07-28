---
sidebar_position: 6
---

# Comparers

With comparators, you can abort the update propagation process if new and old data are equivalent

### Shallow & Deep

Whatsup comparators are based on mutators and can be used more flexibly.
If we use `mobx` we will do it like this:

```tsx
const users = observable.array<User>([])
const admins = computed(() => users.filter((u) => u.isAdmin), {
    equals: comparer.shallow,
})
```

Here is `whatsup` way:

```tsx
import { shallow } from 'whatsup/equals'

const users = array<User>([])
const admins = computed(() => shallow(users.filter((u) => u.isAdmin)))
```

Whatsup provides comparators as a separate library `@whatsup/equals` (shorthand `whatsup/equals`), so far it includes only `shallow` and `deep`, but in the future it will be replenished with the most popular ones

### Custom comparator

You can easily create your own comparator

```tsx
import { comparator } from 'whatsup'

const usersComparator = comparator<User>(
    (next, prev) =>
        Array.isArray(prev) &&
        prev.lenght === next.length &&
        prev.every((item, i) => item === next[i])
)
const users = array<User>([])
const admins = computed(() => usersComparator(users.filter((u) => u.isAdmin)))
```

To create a comparator, you only need a callback that takes a new and old value, compares and returns true or false
