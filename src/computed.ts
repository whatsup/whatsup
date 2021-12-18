import { Atom } from './atom'
import { FunctionalBuilder } from './builder'
import { Cache, Err } from './cache'
import { Context } from './context'
import { spider } from './spider'

export class Computed<T = unknown> {
    private atom: Atom<T>

    constructor(cb: (context?: Context) => T) {
        const builder = new FunctionalBuilder(cb, this)
        const context = new Context()

        this.atom = new Atom(builder, context)
    }

    *[Symbol.iterator](): Generator<never, T, Cache> {
        return this.get() as any
    }

    get() {
        if (spider.watch(this.atom)) {
            if (!this.atom.hasCache()) {
                this.atom.builder.build()
            }

            const cache = this.atom.getCache()

            if (cache instanceof Err) {
                throw cache!.value
            }

            return cache!.value
        }

        return (this.atom.builder as FunctionalBuilder).calc()
    }
}
