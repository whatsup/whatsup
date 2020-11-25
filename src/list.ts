import { Stream } from './stream'
import { Observable } from './observable'

export interface ListOptions {}

class Sequence<T> extends Array<T> {
    *[Symbol.iterator](): Generator<T> {
        for (const item of this) {
            if (item instanceof Stream) {
                yield yield* item
            } else {
                yield item
            }
        }
    }
}

export class List<T> extends Observable<Sequence<T>> {
    set(items: T[]) {
        const sequence = new Sequence(...items)
        super.set(sequence)
    }

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
}

export function list<T>(items: T[] = []) {
    return new List(new Sequence(...items))
}
