import { Atom } from './atom'
import { FunBuilder } from './builder'
import { Cache, Err } from './cache'
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
        if (this.atom.dependencies.register() || this.atom.consumers.size > 0) {
            if (!this.atom.hasCache()) {
                const cache = this.atom.builder.build()

                this.atom.setCache(cache as Cache<T>)
            }

            const cache = this.atom.getCache()

            if (cache instanceof Err) {
                throw cache!.value
            }

            return cache!.value
        }

        return (this.atom.builder as FunBuilder<T>).calc()
    }
}

export function computed<T>(cb: (context?: Context) => T) {
    return new Computed(cb)
}
