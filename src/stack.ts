export class Stack<T extends Iterator<any>> {
    private items = [] as T[]
    private last: T | undefined

    get empty() {
        return !this.last
    }

    next<U>(input: U) {
        if (this.empty) {
            throw 'Stack is empty'
        }
        return this.last!.next(input as any)
    }

    push(item: T) {
        this.items.push(item)
        this.last = item
    }

    pop() {
        const item = this.items.pop()
        this.last = this.items[this.items.length - 1]
        return item
    }
}
