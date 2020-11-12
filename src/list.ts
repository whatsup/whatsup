import { Emitter } from './emitter'
import { Fraction, FractionOptions } from './fraction'
import { Scope } from './fork'

export interface ListOptions extends FractionOptions {}

export class List<T> extends Fraction<T[]> {
    get items() {
        return this.get()
    }

    async *collector(scope: Scope<T[]>) {
        const { delegation } = this

        for await (const items of super.collector(scope)) {
            const result = [] as T[]

            for (const item of items) {
                if (delegation && item instanceof Emitter) {
                    result.push(yield* item)
                } else {
                    result.push(item)
                }
            }

            yield result
        }
    }

    push(...items: T[]): number {
        const newItems = this.items.slice()
        const result = newItems.push(...items)
        this.set(newItems)
        return result
    }

    unshift(...items: T[]): number {
        const newItems = this.items.slice()
        const result = newItems.unshift(...items)
        this.set(newItems)
        return result
    }

    pop(): T | undefined {
        const newItems = this.items.slice()
        const result = newItems.pop()
        this.set(newItems)
        return result
    }

    shift(): T | undefined {
        const newItems = this.items.slice()
        const result = newItems.shift()
        this.set(newItems)
        return result
    }

    sort(compareFn?: (a: T, b: T) => number): this {
        const newItems = this.items.slice()
        newItems.sort(compareFn)
        this.set(newItems)
        return this
    }

    reverse(): this {
        const newItems = this.items.slice()
        newItems.reverse()
        this.set(newItems)
        return this
    }

    splice(start: number, deleteCount?: number): this
    splice(start: number, deleteCount: number, ...items: T[]): this {
        const newItems = this.items.slice()
        newItems.splice(start, deleteCount, ...items)
        this.set(newItems)
        return this
    }

    delete(item: T) {
        const index = this.items.indexOf(item)

        if (index !== -1) {
            this.deleteAt(index)
        }
    }

    deleteAt(index: number) {
        const newItems = this.items.slice()
        newItems.splice(index, 1)
        this.set(newItems)
    }
}

export function list<T>(items: T[] = [], options?: ListOptions) {
    return new List(items, options)
}
