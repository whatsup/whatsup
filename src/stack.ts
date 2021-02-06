class Item {
    constructor(readonly iterator: any, readonly prev: Item | undefined) {}
}

export class Stack<T extends Iterator<U, UR, UN>, U = any, UR = any, UN = any> {
    private last: Item | undefined

    get empty() {
        return this.last === undefined
    }

    next(input: UN) {
        return this.last!.iterator.next(input)
    }

    push(iterator: T) {
        this.last = new Item(iterator, this.last)
    }

    pop() {
        const { prev, iterator } = this.last!
        this.last = prev
        return iterator
    }
}
