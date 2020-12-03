import { StreamIterator, Stream, Delegation } from './stream'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { ConsumerQuery } from './query'
import { Mutator } from './mutator'
import { SCHEDULER } from './scheduler'
import { ErrorCache, DataCache } from './cache'
import { Stack } from './stack'

export class Atom<T = any> {
    private readonly stream: Stream<T>
    private readonly context: Context
    private readonly consumers: Set<Atom>
    private readonly stack: Stack<StreamIterator<T>>
    private readonly dependencies: Dependencies
    private readonly delegations: WeakMap<Stream<any>, Delegation<T>>
    private cache: ErrorCache | DataCache<T | Delegation<T>> | undefined

    constructor(stream: Stream<T>, parentContext: Context | null = null) {
        this.stream = stream
        this.context = new Context(this, parentContext)
        this.consumers = new Set()
        this.stack = new Stack<StreamIterator<T>>()
        this.dependencies = new Dependencies(this)
        this.delegations = new WeakMap<Stream<any>, Delegation<T>>()
    }

    addConsumer(consumer: Atom) {
        this.consumers.add(consumer)
    }

    getConsumers() {
        return this.consumers
    }

    getContext() {
        return this.context
    }

    getCache() {
        return this.cache
    }

    getCacheValue() {
        return this.cache && this.cache.value
    }

    update() {
        SCHEDULER.run((transaction) => transaction.add(this))
    }

    destroy(initiator?: Atom) {
        if (initiator) {
            this.consumers.delete(initiator)
        }
        if (this.consumers.size === 0) {
            this.cache = undefined
            this.context.destroy()
            this.dependencies.destroy()

            while (!this.stack.empty) {
                this.stack.pop()!.return!()
            }
        }
    }

    *[Symbol.iterator](): Generator<never, T, any> {
        //        this is ^^^^^^^^^^^^^^^^^^^^^^^^ for better type inference
        //        really is Generator<this | Query, T, any>
        if (!this.cache) {
            this.build()
        }

        if (this.cache instanceof ErrorCache) {
            throw yield this as never
        }

        return yield this as never
    }

    build() {
        const { stack, dependencies, context, stream } = this

        dependencies.swap()

        if (stack.empty) {
            stack.push(stream.iterate(context))
        }

        let input: any

        while (true) {
            try {
                const { done, value } = stack.last.next(input)

                if (done) {
                    stack.pop()

                    if (!stack.empty) {
                        input = value
                        continue
                    }
                }
                if (value instanceof ConsumerQuery) {
                    input = this
                    continue
                }
                if (value instanceof Atom) {
                    const cacheValue = value.getCacheValue()

                    if (cacheValue instanceof Delegation) {
                        const iterator = cacheValue[Symbol.iterator]()
                        this.stack.push(iterator)
                        input = undefined
                    } else {
                        input = cacheValue
                    }

                    dependencies.add(value)
                    continue
                }

                const data = this.prepareNewData(value)
                this.cache = new DataCache(data)
            } catch (error) {
                stack.pop()
                this.cache = new ErrorCache(error)
            }

            dependencies.destroyUnused()
            return
        }
    }

    protected prepareNewData(value: T): T | Delegation<T> {
        if (value instanceof Mutator) {
            const oldValue = this.getCacheValue()
            const newValue = value.mutate(oldValue) as T
            return newValue
        }

        if (this.stream.delegator && value instanceof Stream) {
            return this.getDelegation(value)
        }

        return value
    }

    private getDelegation(stream: Stream<any>) {
        if (!this.delegations.has(stream)) {
            const delegation = new Delegation(stream, this.context)
            this.delegations.set(stream, delegation)
        }
        return this.delegations.get(stream)!
    }
}
