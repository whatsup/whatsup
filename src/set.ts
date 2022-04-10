import { observable, Observable } from './observable'
import { transaction, isBuildProcess } from './scheduler'

export class ObservableSet<T> {
    private readonly hasMap: Map<T, null | Observable<boolean>>
    private readonly length: Observable<number>

    constructor(entries: Iterable<T>) {
        const hasMapEntries = [] as [T, null][]

        for (const item of entries) {
            hasMapEntries.push([item, null])
        }

        this.hasMap = new Map(hasMapEntries)
        this.length = observable(hasMapEntries.length)
    }

    get size() {
        return this.length.get()
    }

    has(item: T) {
        if (isBuildProcess()) {
            const has = this.hasMap.has(item)

            if (!has || this.hasMap.get(item) === null) {
                const trigger = observable<boolean>(has)

                trigger.atom.onDispose((has) => {
                    if (has) {
                        this.hasMap.set(item, null)
                    } else {
                        this.hasMap.delete(item)
                    }
                })

                this.hasMap.set(item, trigger)
            }

            return this.hasMap.get(item)!.get()
        }

        if (this.hasMap.has(item)) {
            const trigger = this.hasMap.get(item)

            if (trigger === null || trigger!.get()) {
                return true
            }
        }

        return false
    }

    add(item: T) {
        transaction(() => {
            let length = this.length.get()

            if (this.hasMap.has(item)) {
                const trigger = this.hasMap.get(item)

                if (trigger !== null && trigger?.get() === false) {
                    trigger.set(true)
                    length++
                }
            } else {
                this.hasMap.set(item, null)
                length++
            }

            this.length.set(length)
        })
        return this
    }

    delete(item: T) {
        if (this.hasMap.has(item)) {
            transaction(() => {
                const trigger = this.hasMap.get(item)

                if (trigger === null) {
                    this.hasMap.delete(item)
                } else {
                    trigger!.set(false)
                }

                const length = this.length.get()

                this.length.set(length - 1)
            })

            return true
        }

        return false
    }

    clear() {
        transaction(() => {
            for (const item of this.hasMap.keys()) {
                this.delete(item)
            }
            this.length.set(0)
        })
    }

    *[Symbol.iterator](): IterableIterator<T> {
        this.length.get()

        for (const [item] of this.hasMap.entries()) {
            if (this.has(item)) {
                yield item
            }
        }
    }

    *values() {
        yield* this
    }

    *keys() {
        yield* this
    }

    *entries(): IterableIterator<[T, T]> {
        for (const item of this) {
            yield [item, item]
        }
    }

    forEach(cb: (value: T, value2: T, set: ObservableSet<T>) => void, thisArg?: any) {
        for (const item of this) {
            cb.call(thisArg, item, item, this)
        }
    }

    toString(): string {
        return '[object ObservableSet]'
    }

    toLocaleString(): string {
        return '[object ObservableSet]'
    }

    get [Symbol.toStringTag]() {
        return 'ObservableSet'
    }
}

export const set = <T>(entries: Iterable<T> = []) => {
    return new ObservableSet(entries)
}
