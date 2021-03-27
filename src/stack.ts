export class Stack<T> {
    private readonly items = [] as T[]

    get empty() {
        return this.items.length === 0
    }

    peek() {
        const index = this.items.length - 1
        return this.items[index]
    }

    push(item: T) {
        this.items.push(item)
    }

    pop() {
        return this.items.pop()
    }
}
