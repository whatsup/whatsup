interface Item<T> {
    readonly value: T
    readonly prev: Item<T> | undefined
}

export class Stack<T> {
    private item: Item<T> | undefined

    get empty() {
        return this.item === undefined
    }

    peek() {
        return this.item!.value
    }

    push(value: T) {
        const prev = this.item
        this.item = { value, prev }
    }

    pop() {
        const { prev, value } = this.item!
        this.item = prev
        return value
    }
}
