---
sidebar_position: 6
---

# Decorators

If you like object-oriented approach, you can use `observable`, `computed` and `action` as decorators.

### Example

```tsx
import { observable, computed, action, autorun } from 'whatsup'

class User {
    @observable
    firstName: string

    @observable
    lastName: string

    @computed
    get fullName() {
        return `${this.firstName} ${this.lastName}`
    }

    @action
    setName(firstName: string, lastName: string) {
        this.firstName = firstName
        this.lastName = lastName
    }

    constructor(firstName: string, lastName: string) {
        this.firstName = firstName
        this.lastName = lastName
    }
}

const user = new User('John', 'Lennon')

autorun(() => console.log(user.fullName))
//> 'John Lennon'

user.setName('Barry', 'Miller')
//> 'Barry Miller'
```
