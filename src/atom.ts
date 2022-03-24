import { Context } from './context'
import { Dependencies } from './dependencies'
import { Cache, Err } from './cache'
import { Builder } from './builder'
import { Delegation } from './delegation'

export class Atom<T = unknown> {
    readonly builder: Builder<T>
    readonly context: Context
    readonly consumers: Set<Atom>
    readonly dependencies: Dependencies
    private cache: Cache<T> | undefined

    constructor(builder: Builder<T>, context: Context) {
        this.builder = builder.attachTo(this)
        this.context = context.attachTo(this)
        this.consumers = new Set()
        this.dependencies = new Dependencies(this)
    }

    get() {
        let cache: Cache<T>
        let atom = this as Atom<T>

        while (true) {
            if (atom.dependencies.register() || atom.consumers.size > 0) {
                if (!atom.hasCache()) {
                    cache = atom.builder.build() as Cache<T>

                    atom.setCache(cache)
                } else {
                    cache = atom.getCache()!
                }
            } else {
                cache = atom.builder.build() as Cache<T>
            }

            if (cache instanceof Err) {
                throw cache!.value
            }

            if (cache.value instanceof Delegation) {
                atom = cache.value.stream.getAtomFor(atom)
                continue
            }

            break
        }

        return cache!.value
    }

    hasCache() {
        return this.cache !== undefined
    }

    getCache() {
        return this.cache
    }

    setCache(cache: Cache<T>) {
        return (this.cache = cache)
    }

    dispose(initiator?: Atom) {
        if (initiator) {
            this.consumers.delete(initiator)
        }
        if (this.consumers.size === 0) {
            this.cache = undefined
            this.context.dispose()
            this.dependencies.dispose()
            this.builder.dispose()
        }
    }
}
