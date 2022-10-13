import { observable, Observable, isObservable } from './observable'
import { build, isBuildProcess } from './builder'

export class ObservableMap<K, V> {
    private readonly hasMap: Map<K, null | Observable<boolean>>
    private readonly dataMap: Map<K, V | Observable<V | undefined> | undefined>
    private readonly length: Observable<number>

    constructor(entries: Iterable<[K, V]>) {
        const hasMapEntries = [] as [K, null][]
        const dataMapEntries = [] as [K, V][]

        for (const [k, v] of entries) {
            hasMapEntries.push([k, null])
            dataMapEntries.push([k, v])
        }

        this.hasMap = new Map(hasMapEntries)
        this.dataMap = new Map(dataMapEntries)
        this.length = observable(dataMapEntries.length)
    }

    get size() {
        return this.length()
    }

    has(key: K) {
        if (isBuildProcess()) {
            const has = this.hasMap.has(key)

            if (!has || this.hasMap.get(key) === null) {
                const accessor = observable<boolean>(has)

                accessor.atom.onDispose((has) => {
                    if (has) {
                        this.hasMap.set(key, null)
                    } else {
                        this.hasMap.delete(key)
                    }
                    this.dataMap.delete(key)
                })

                this.hasMap.set(key, accessor)
            }

            return this.hasMap.get(key)!()
        }

        if (this.hasMap.has(key)) {
            const accessor = this.hasMap.get(key)

            if (accessor === null || accessor!()) {
                return true
            }
        }

        return false
    }

    get(key: K) {
        if (this.has(key)) {
            const data = this.dataMap.get(key)

            if (isObservable<V | undefined>(data)) {
                return data()
            }

            if (isBuildProcess()) {
                const accessor = observable<V | undefined>(data as V | undefined)

                accessor.atom.onDispose((val) => {
                    if (this.dataMap.has(key)) {
                        this.dataMap.set(key, val as V)
                    }
                })

                this.dataMap.set(key, accessor)

                return accessor()
            }

            return data
        }

        return undefined
    }

    set(key: K, value: V) {
        build(() => {
            let length = this.length()

            if (this.hasMap.has(key)) {
                const accessor = this.hasMap.get(key)

                if (accessor != null && accessor() === false) {
                    accessor(true)
                    length++
                }
            } else {
                this.hasMap.set(key, null)
                length++
            }

            if (this.dataMap.has(key)) {
                const data = this.dataMap.get(key)!

                if (isObservable<V | undefined>(data)) {
                    data(value)
                } else {
                    this.dataMap.set(key, value)
                }
            } else {
                this.dataMap.set(key, value)
            }

            this.length(length)
        })

        return this
    }

    delete(key: K) {
        if (this.hasMap.has(key)) {
            build(() => {
                const accessor = this.hasMap.get(key)
                const data = this.dataMap.get(key)

                if (accessor === null) {
                    this.hasMap.delete(key)
                } else {
                    accessor!(false)
                }

                if (isObservable<V | undefined>(data)) {
                    data(undefined)
                } else {
                    this.dataMap.delete(key)
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
            for (const key of this.hasMap.keys()) {
                this.delete(key)
            }
            this.length(0)
        })
    }

    *[Symbol.iterator](): IterableIterator<[K, V]> {
        this.length()

        for (const [key] of this.hasMap.entries()) {
            if (this.has(key)) {
                const value = this.get(key)!

                yield [key, value]
            }
        }
    }

    *values() {
        for (const [, value] of this) {
            yield value
        }
    }

    *keys() {
        for (const [key] of this) {
            yield key
        }
    }

    *entries() {
        yield* this
    }

    forEach(cb: (key: K, value: V, set: ObservableMap<K, V>) => void, thisArg?: any) {
        for (const [key, value] of this) {
            cb.call(thisArg, key, value, this)
        }
    }

    toString(): string {
        return '[object ObservableMap]'
    }

    toLocaleString(): string {
        return '[object ObservableMap]'
    }

    get [Symbol.toStringTag]() {
        return 'ObservableMap'
    }
}

export const map = <K, V>(entries: Iterable<[K, V]> = []) => {
    return new ObservableMap(entries)
}
