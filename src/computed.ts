import { Atom } from './atom'
import { FunBuilder } from './builder'
import { Cache } from './cache'
import { Context } from './context'

export class Computed<T = unknown> {
    private atom: Atom<T>

    constructor(cb: (context?: Context) => T) {
        const builder = new FunBuilder(cb, this)
        const context = new Context()

        this.atom = new Atom(builder, context)
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
