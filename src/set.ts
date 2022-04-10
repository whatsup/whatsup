import { observable, Observable } from './observable'
import { transaction, isBuildProcess } from './scheduler'

export class ObservableSet<T> {
    private readonly map: Map<T, null | Observable<boolean>>
    private readonly length: Observable<number>

    constructor(entries: Iterable<T>) {
        const initial = [...entries].map((i) => [i, null]) as [T, null][]

        this.map = new Map(initial)
        this.length = observable(initial.length)
    }

    get size() {
        return this.length.get()
    }

    has(item: T) {
        if (isBuildProcess()) {
            const has = this.map.has(item)

            if (!has || this.map.get(item) === null) {
                const trigger = observable<boolean>(has)

                trigger.atom.onDispose((has) => {
                    if (has) {
                        this.map.set(item, null)
                    } else {
                        this.map.delete(item)
                    }
                })

                this.map.set(item, trigger)
            }

            return this.map.get(item)!.get()
        }

        if (this.map.has(item)) {
            const trigger = this.map.get(item)

            if (trigger === null || trigger!.get()) {
                return true
            }
        }

        return false
    }

    add(item: T) {
        if (this.map.has(item)) {
            this.map.get(item)?.set(true)
        } else {
            this.map.set(item, null)
        }

        const length = this.length.get()

        this.length.set(length + 1)

        return this
    }

    delete(item: T) {
        if (this.map.has(item)) {
            const trigger = this.map.get(item)

            if (trigger === null) {
                this.map.delete(item)
            } else {
                trigger!.set(false)
            }

            const length = this.length.get()

            this.length.set(length - 1)

            return true
        }

        return false
    }

    clear() {
        transaction(() => {
            for (const item of this.map.keys()) {
                this.delete(item)
            }
        })
    }

    *[Symbol.iterator]() {
        this.length.get()

        for (const [item, trigger] of this.map.entries()) {
            if (trigger === null || trigger.get()) {
                yield item
            }
        }
    }

    *values() {
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
