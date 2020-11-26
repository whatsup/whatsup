import { StreamIterator, Stream, Delegation } from './stream'
import { Fractal } from './fractal'
import { Computed } from './computed'
import { RootContext, Context } from './context'
import { Dependencies } from './dependencies'
import { ConsumerQuery } from './query'
import { Mutator } from './mutator'
import { initTransaction, createTransactionKey } from './transaction'
import { ErrorCache, DataCache } from './cache'
import { Stack } from './stack'

export abstract class Atom<T = any> {
    protected abstract readonly context: RootContext

    private readonly entity: Stream<T>
    private readonly consumers = new Set<Atom>()
    private readonly stack = new Stack<StreamIterator<T>>()
    private readonly dependencies: Dependencies
    private cache: ErrorCache | DataCache<T | Delegation<T>> | undefined

    constructor(entity: Stream<T>) {
        this.entity = entity
        this.dependencies = new Dependencies(this)
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
        const key = createTransactionKey()
        const transaction = initTransaction(key)
        transaction.add(this)
        transaction.run(key)
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

    *[Symbol.iterator]() {
        if (!this.cache) {
            this.build()
        }

        if (this.cache instanceof ErrorCache) {
            throw yield this
        }

        return yield this
    }

    build() {
        const { stack, dependencies, context, entity } = this

        dependencies.swap()

        if (stack.empty) {
            stack.push(entity.iterate(context))
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

        return value
    }
}

export class ComputedAtom<T = any> extends Atom<T> {
    protected readonly context: RootContext

    constructor(entity: Computed<T>) {
        super(entity)
        this.context = new RootContext(this)
    }
}

export class FractalAtom<T = any> extends Atom<T> {
    protected readonly context: Context
    private readonly delegations = new WeakMap<Fractal<any>, Delegation<T>>()

    constructor(entity: Fractal<T>, parentContext: RootContext | Context) {
        super(entity)
        this.context = new Context(this, parentContext)
    }

    protected prepareNewData(value: T) {
        if (value instanceof Fractal) {
            return this.getDelegation(value)
        }

        return super.prepareNewData(value)
    }

    private getDelegation(fractal: Fractal<T>) {
        if (!this.delegations.has(fractal)) {
            const delegation = new Delegation(fractal, this.context)
            this.delegations.set(fractal, delegation)
        }
        return this.delegations.get(fractal)!
    }
}
