import { Atom } from './atom'
import { FunctionalBuilder } from './builder'
import { Cache, Err } from './cache'
import { Context } from './context'
import { spider } from './spider'
import { transaction } from './scheduler'

export class Observable<T = unknown> {
    private atom: Atom<T>
    private value: T

    constructor(value: T) {
        const cb = () => this.value
        const builder = new FunctionalBuilder(cb, this)
        const context = new Context()

        this.atom = new Atom(builder, context)
        this.value = value
    }

    *[Symbol.iterator](): Generator<never, T, Cache> {
        return this.get() as any
    }

    get() {
        if (spider.watch(this.atom) || this.atom.consumers.size > 0) {
            if (!this.atom.hasCache()) {
                this.atom.builder.build()
            }

            const cache = this.atom.getCache()

            if (cache instanceof Err) {
                throw cache!.value
            }

            return cache!.value
        }

        return (this.atom.builder as FunctionalBuilder<T>).calc()
    }

    set(value: T) {
        this.value = value

        transaction((t) => t.include(this.atom))
    }
}

export function observable<T>(value: T) {
    return new Observable(value)
}
