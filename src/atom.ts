import { CollectIterator, Stream, Delegation, Streamable } from './stream'
import { Fractal } from './fractal'
import { Computed } from './computed'
import { Controller, ContextController } from './controller'
import { Dependencies } from './dependencies'
import { ConsumerQuery } from './query'
import { Mutator } from './mutator'
import { initTransaction, createTransactionKey } from './transaction'
import { ErrorCache, DataCache } from './cache'
import { Stack } from './stack'

export abstract class Atom<T = any> {
    protected abstract readonly controller: Controller
    protected abstract extract(atom: Atom<T>): undefined | T | Error

    private readonly entity: Stream<T>
    private readonly consumers = new Set<Atom>()
    private readonly stack = new Stack<CollectIterator<T>>()
    private readonly dependencies: Dependencies
    private cache: ErrorCache | DataCache<T> | undefined

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

    getController() {
        return this.controller
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
            this.controller.destroy()
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
        const { stack, dependencies, controller, entity } = this

        dependencies.swap()

        if (stack.empty) {
            stack.push(entity.collect(controller))
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
                    input = this.extract(value)
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

    protected prepareNewData(value: T) {
        if (value instanceof Mutator) {
            const oldValue = this.getCacheValue()
            const newValue = value.mutate(oldValue) as T
            return newValue
        }

        return value
    }

    protected pushToStack(iterator: CollectIterator<T>) {
        this.stack.push(iterator)
    }
}

export class ComputedAtom<T = any> extends Atom<T> {
    protected readonly controller: Controller

    constructor(entity: Computed<T>) {
        super(entity)
        this.controller = new Controller(this)
    }

    protected extract(atom: Atom<T>) {
        return atom.getCacheValue()
    }
}

export class FractalAtom<T = any> extends Atom<T | Delegation<T>> {
    protected readonly controller: ContextController
    private readonly delegations = new WeakMap<Fractal<any>, Delegation<T>>()

    constructor(entity: Fractal<T>, parentController: ContextController | null) {
        super(entity)
        this.controller = new ContextController(this, parentController)
    }

    protected extract(atom: Atom<T>) {
        const value = atom.getCacheValue()

        if (value instanceof Streamable) {
            const iterator = value[Symbol.iterator]()
            this.pushToStack(iterator)
            return undefined
        }

        return value
    }

    protected prepareNewData(value: T) {
        if (value instanceof Fractal) {
            return this.getDelegation(value)
        }

        return super.prepareNewData(value)
    }

    private getDelegation(fractal: Fractal<T>) {
        if (!this.delegations.has(fractal)) {
            const delegation = new Delegation(fractal, this.controller)
            this.delegations.set(fractal, delegation)
        }
        return this.delegations.get(fractal)!
    }
}
