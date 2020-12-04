export class Stack<T> {
    private cursor = -1
    private items = [] as T[]

    get empty() {
        return this.cursor === -1
    }

    get last() {
        return this.items[this.cursor]
    }

    push(item: T) {
        this.items.push(item)
        this.cursor++
    }

    pop() {
        const item = this.items.pop()
        this.cursor--
        return item
    }
}
