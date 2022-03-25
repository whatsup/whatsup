import { Atom } from './atom'
import { Cache } from './cache'
import { transaction } from './scheduler'

export class Observable<T = unknown> {
    private atom: Atom<T>
    private value: T

    constructor(value: T) {
        const cb = () => this.value

        this.atom = Atom.create(null, cb, this)
        this.value = value
    }

    *[Symbol.iterator](): Generator<never, T, Cache> {
        return this.get() as any
    }

    get() {
        return this.atom.get()
    }

    set(value: T) {
        this.value = value

        transaction((t) => t.include(this.atom))
    }
}

export function observable<T>(value: T) {
    return new Observable(value)
}
