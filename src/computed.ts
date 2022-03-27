import { atom, Atom } from './atom'
import { Data } from './data'
import { Context } from './context'

export class Computed<T = unknown> {
    private atom: Atom<T>

    constructor(cb: (context?: Context) => T) {
        this.atom = atom(null, cb, this)
    }

    *[Symbol.iterator](): Generator<never, T, Data> {
        return this.get() as any
    }

    get() {
        return this.atom.get()
    }
}

export function computed<T>(cb: (context?: Context) => T) {
    return new Computed(cb)
}
