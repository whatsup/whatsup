import { atom, Atom } from './atom'
import { Cache } from './cache'
import { Context } from './context'

export class Computed<T = unknown> {
    private atom: Atom<T>

    constructor(cb: (context?: Context) => T) {
        this.atom = atom(null, cb, this)
    }

    *[Symbol.iterator](): Generator<never, T, Cache> {
        return this.get() as any
    }

    get() {
        return this.atom.get()
    }
}

export function computed<T>(cb: (context?: Context) => T) {
    return new Computed(cb)
}
