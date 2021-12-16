import { StreamIterator, StreamLike } from './stream'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { Cache } from './cache'
import { Stack } from './stack'

export class Atom<T = unknown> {
    readonly stream: StreamLike<T>
    readonly context: Context
    readonly stack: Stack<StreamIterator<T>>
    readonly consumers: Set<Atom>
    readonly dependencies: Dependencies
    private cache: Cache<T> | undefined

    constructor(stream: StreamLike<T>, context: Context) {
        this.stream = stream
        this.context = context.attachTo(this)
        this.stack = new Stack()
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

            while (!this.stack.empty) {
                this.stack.pop()!.return!()
            }
        }
    }
}
