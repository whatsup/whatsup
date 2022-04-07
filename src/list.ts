import { Observable } from './observable'

export class List<T> extends Observable<T[]> {
    splice(start: number, deleteCount?: number): this
    splice(start: number, deleteCount: number, ...items: T[]): this
    splice(start: number, ...other: any[]): this {
        const newItems = this.get().slice()
        newItems.splice(start, ...other)
        this.set(newItems)
        return this
    }

    insert(...items: T[]): this {
        const newItems = this.get().slice()
        newItems.push(...items)
        this.set(newItems)
        return this
    }

    insertAt(index: number, ...items: T[]): this {
        return this.splice(index, 0, ...items)
    }

    delete(...items: T[]): this {
        const newItems = this.get().slice()

        for (const item of items) {
            const index = newItems.indexOf(item)
            newItems.splice(index, 1)
        }

        this.set(newItems)

        return this
    }

    deleteAt(index: number, deleteCount = 1): this {
        return this.splice(index, deleteCount)
    }

    sort(compareFn?: (a: T, b: T) => number): this {
        const newItems = this.get().slice()
        newItems.sort(compareFn)
        this.set(newItems)
        return this
    }

    reverse(): this {
        const newItems = this.get().slice()
        newItems.reverse()
        this.set(newItems)
        return this
    }

    *[Symbol.iterator]() {
        yield* this.get()
    }
}

export function list<T>(items: T[] = []) {
    return new List(items)
}
