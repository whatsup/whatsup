import { Context } from './context'
import { Dependencies } from './dependencies'
import { Cache } from './cache'
import { Builder } from './builder'

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
