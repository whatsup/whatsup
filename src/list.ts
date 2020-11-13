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

    splice(start: number, deleteCount?: number): this
    splice(start: number, deleteCount: number, ...items: T[]): this
    splice(start: number, ...other: any[]): this {
        const newItems = this.data.slice()
        newItems.splice(start, ...other)
        this.set(newItems)
        return this
    }

    insert(...items: T[]): this {
        const newItems = this.data.slice()
        newItems.push(...items)
        this.set(newItems)
        return this
    }

    insertAt(index: number, ...items: T[]): this {
        return this.splice(index, 0, ...items)
    }

    delete(...items: T[]): this {
        const newItems = this.data.slice()

        for (const item of items) {
            const index = this.data.indexOf(item)
            newItems.splice(index, 1)
        }

        this.set(newItems)

        return this
    }

    deleteAt(index: number, deleteCount = 1): this {
        return this.splice(index, deleteCount)
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
