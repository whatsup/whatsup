import { StreamIterator, Stream, DelegatingStream, Delegation } from './stream'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { ConsumerQuery, Query } from './query'
import { Mutator } from './mutator'
import { SCHEDULER } from './scheduler'
import { ErrorCache, DataCache, Cache } from './cache'
import { Stack } from './stack'
import { ActorGenerator } from './actor'

export class Atom<T = any> {
    private readonly stream: Stream<T>
    private readonly context: Context
    private readonly stack: Stack<StreamIterator<T>>
    private readonly consumers: Set<Atom>
    private readonly dependencies: Dependencies
    private readonly delegations: WeakMap<Stream<any>, Delegation<T>>
    private cache: ErrorCache | DataCache<T | Delegation<T>> | undefined

    constructor(stream: Stream<T>, parentContext: Context | null = null) {
        this.stream = stream
        this.context = new Context(this, parentContext)
        this.consumers = new Set()
        this.stack = new Stack()
        this.dependencies = new Dependencies(this)
        this.delegations = new WeakMap()
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

    exec<U, A>(generator: ActorGenerator<U, A>, arg: A): U | Delegation<U> {
        const { context, stream } = this
        const stack = new Stack<StreamIterator<U>>()

        stack.push(generator.call(stream, context, arg))

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

                    const data = this.prepareNewData(value as any)

                    return (new DataCache(data) as any) as U | Delegation<U>
                }
                if (value instanceof ConsumerQuery) {
                    input = this
                    continue
                }
                if (value instanceof Atom) {
                    const { stream } = value

                    const cache = value.exec(function* () {
                        const iterator = stream.iterate(context)
                        let input: any

                        while (true) {
                            const { done, value } = iterator.next(input)

                            if (done) {
                                return value
                            }
                            if (value instanceof Query || value instanceof Atom) {
                                input = yield value
                                continue
                            }

                            return value
                        }
                    }, null)

                    if (cache.value instanceof Delegation) {
                        stack.push(
                            function* () {
                                try {
                                    const result = yield* cache.value

                                    return new DataCache(result) as any
                                } catch (result) {
                                    return new ErrorCache(result) as any
                                }
                            }.call(undefined)
                        )
                        input = undefined
                    } else {
                        input = cache
                    }

                    continue
                }

                throw 'Unknown value'
            } catch (error) {
                return new ErrorCache(error) as any
                //return ({ error: true, result: e } as any) as U | Delegation<U>
            }
        }
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

    *[Symbol.iterator](): Generator<never, T, any> {
        //        this is ^^^^^^^^^^^^^^^^^^^^^^^^ for better type inference
        //        really is Generator<this | Query, T, any>
        const cache = (yield this as never) as Cache

        if (cache instanceof ErrorCache) {
            throw cache.value
        }

        return cache.value
    }

    buildIfNeeded() {
        if (!this.cache) {
            this.build()
        }
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
                    value.buildIfNeeded()

                    const cache = value.cache!

                    if (cache.value instanceof Delegation) {
                        this.stack.push(
                            function* () {
                                try {
                                    const result = yield* cache.value

                                    return new DataCache(result) as any
                                } catch (result) {
                                    return new ErrorCache(result) as any
                                }
                            }.call(undefined)
                        )

                        input = undefined
                    } else {
                        input = cache
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

            dependencies.disposeUnused()
            return
        }
    }

    private prepareNewData(value: T): T | Delegation<T> {
        if (value instanceof Mutator) {
            const oldValue = this.getCacheValue()
            const newValue = value.mutate(oldValue) as T
            return newValue
        }

        if (value instanceof Stream && this.stream instanceof DelegatingStream) {
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
