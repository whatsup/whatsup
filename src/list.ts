import { Emitter } from './emitter'
import { Context } from './context'
import { Fraction, FractionOptions } from './fraction'

export interface ListOptions extends FractionOptions {}

export class List<T> extends Fraction<T[]> {
    async *collector(context: Context) {
        const { delegation } = this

        for await (const items of super.collector(context)) {
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
        const newItems = this.data.slice()
        const result = newItems.push(...items)
        this.set(newItems)
        return result
    }

    pop(): T | undefined {
        const newItems = this.data.slice()
        const result = newItems.pop()
        this.set(newItems)
        return result
    }

    unshift(...items: T[]): number {
        const newItems = this.data.slice()
        const result = newItems.unshift(...items)
        this.set(newItems)
        return result
    }

    shift(): T | undefined {
        const newItems = this.data.slice()
        const result = newItems.shift()
        this.set(newItems)
        return result
    }

    splice(start: number, deleteCount?: number): this
    splice(start: number, deleteCount: number, ...items: T[]): this {
        const newItems = this.data.slice()
        newItems.splice(start, deleteCount, ...items)
        this.set(newItems)
        return this
    }

    delete(item: T): this {
        const index = this.data.indexOf(item)

        if (index !== -1) {
            this.deleteAt(index)
        }

        return this
    }

    deleteAt(index: number): this {
        return this.splice(index, 1)
    }

    sort(compareFn?: (a: T, b: T) => number): this {
        const newItems = this.data.slice()
        newItems.sort(compareFn)
        this.set(newItems)
        return this
    }

    reverse(): this {
        const newItems = this.data.slice()
        newItems.reverse()
        this.set(newItems)
        return this
    }
}

export function list<T>(items: T[] = [], options?: ListOptions) {
    return new List(items, options)
}
