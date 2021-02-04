export class Stack<T extends Iterator<U, UR, UN>, U = any, UR = any, UN = any> {
    private items: T[]
    private last: T | undefined

    constructor(...iterators: T[]) {
        this.items = iterators
        this.last = iterators[iterators.length - 1]
    }

    get empty() {
        return !this.last
    }

    next(input: UN) {
        if (this.empty) {
            throw 'Stack is empty'
        }
        return this.last!.next(input)
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
