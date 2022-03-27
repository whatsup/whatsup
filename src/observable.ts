import { atom, Atom } from './atom'
import { Data } from './data'
import { transaction } from './scheduler'

export class Observable<T = unknown> {
    private atom: Atom<T>
    private value: T

    constructor(value: T) {
        const cb = () => this.value

        this.atom = atom(null, cb, this)
        this.value = value
    }

    *[Symbol.iterator](): Generator<never, T, Data> {
        return this.get() as any
    }

    get() {
        return this.atom.get()
    }

    set(value: T) {
        this.value = value

        transaction((t) => t.addEntry(this.atom))
    }
}

export function observable<T>(value: T) {
    return new Observable(value)
}
