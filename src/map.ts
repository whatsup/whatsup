import { observable, Observable } from './observable'
import { transaction, isBuildProcess } from './scheduler'

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
        return this.length.get()
    }

    has(key: K) {
        if (isBuildProcess()) {
            const has = this.hasMap.has(key)

            if (!has || this.hasMap.get(key) === null) {
                const trigger = observable<boolean>(has)

                trigger.atom.onDispose((has) => {
                    if (has) {
                        this.hasMap.set(key, null)
                    } else {
                        this.hasMap.delete(key)
                    }
                    this.dataMap.delete(key)
                })

                this.hasMap.set(key, trigger)
            }

            return this.hasMap.get(key)!.get()
        }

        if (this.hasMap.has(key)) {
            const trigger = this.hasMap.get(key)

            if (trigger === null || trigger!.get()) {
                return true
            }
        }

        return false
    }

    get(key: K) {
        if (this.has(key)) {
            const data = this.dataMap.get(key)

            if (data instanceof Observable) {
                return data.get()
            }

            if (isBuildProcess()) {
                const trigger = observable<V | undefined>(data)

                trigger.atom.onDispose((val) => {
                    if (this.dataMap.has(key)) {
                        this.dataMap.set(key, val as V)
                    }
                })

                this.dataMap.set(key, trigger)

                return trigger.get()
            }

            return data
        }

        return undefined
    }

    set(key: K, value: V) {
        transaction(() => {
            if (this.hasMap.has(key)) {
                this.hasMap.get(key)?.set(true)
            } else {
                this.hasMap.set(key, null)
            }

            if (this.dataMap.has(key)) {
                const data = this.dataMap.get(key)!

                if (data instanceof Observable) {
                    data.set(value)
                } else {
                    this.dataMap.set(key, value)
                }
            } else {
                this.dataMap.set(key, value)
            }

            const length = this.length.get()

            this.length.set(length + 1)
        })

        return this
    }

    delete(key: K) {
        if (this.hasMap.has(key)) {
            const trigger = this.hasMap.get(key)
            const data = this.dataMap.get(key)

            if (trigger === null) {
                this.hasMap.delete(key)
            } else {
                trigger!.set(false)
            }

            if (data instanceof Observable) {
                data.set(undefined)
            } else {
                this.dataMap.delete(key)
            }

            const length = this.length.get()

            this.length.set(length - 1)

            return true
        }

        return false
    }

    clear() {
        transaction(() => {
            for (const key of this.hasMap.keys()) {
                this.delete(key)
            }
            this.length.set(0)
        })
    }

    *[Symbol.iterator](): IterableIterator<[K, V]> {
        this.length.get()

        for (const [key, trigger] of this.hasMap.entries()) {
            if (trigger === null || trigger.get()) {
                const data = this.dataMap.get(key)
                const value = data instanceof Observable ? data.get()! : data!

                yield [key, value]
            }
        }
    }

    *values() {
        for (const [, value] of this) {
            yield value
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
