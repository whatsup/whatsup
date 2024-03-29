import { observable, Observable } from './observable'
import { build, isBuildProcess } from './builder'

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
        return this.length()
    }

    has(item: T) {
        if (isBuildProcess()) {
            const has = this.hasMap.has(item)

            if (!has || this.hasMap.get(item) === null) {
                const accessor = observable<boolean>(has)

                accessor.atom.onDispose((has) => {
                    if (has) {
                        this.hasMap.set(item, null)
                    } else {
                        this.hasMap.delete(item)
                    }
                })

                this.hasMap.set(item, accessor)
            }

            return this.hasMap.get(item)!()
        }

        if (this.hasMap.has(item)) {
            const accessor = this.hasMap.get(item)

            if (accessor === null || accessor!()) {
                return true
            }
        }

        return false
    }

    add(item: T) {
        build(() => {
            let length = this.length()

            if (this.hasMap.has(item)) {
                const accessor = this.hasMap.get(item)

                if (accessor != null && accessor() === false) {
                    accessor(true)
                    length++
                }
            } else {
                this.hasMap.set(item, null)
                length++
            }

            this.length(length)
        })
        return this
    }

    delete(item: T) {
        if (this.hasMap.has(item)) {
            build(() => {
                const accessor = this.hasMap.get(item)

                if (accessor === null) {
                    this.hasMap.delete(item)
                } else {
                    accessor!(false)
                }

                const length = this.length()

                this.length(length - 1)
            })

            return true
        }

        return false
    }

    clear() {
        build(() => {
            for (const item of this.hasMap.keys()) {
                this.delete(item)
            }
            this.length(0)
        })
    }

    *[Symbol.iterator](): IterableIterator<T> {
        this.length()

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
