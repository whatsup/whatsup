import { Context } from './context'
import { Dependencies } from './dependencies'
import { Cache, Data, Err } from './cache'
import { Delegation } from './delegation'
import { Payload, StreamIterator } from './stream'
import { Mutator } from './mutator'
import { isGenerator } from './utils'
import { Stack } from './stack'
import { Command, GetConsumer } from './command'

export abstract class Atom<T = unknown> {
    static create<T>(
        parentContext: Context | null,
        producer: (context?: Context) => T | Generator<T>,
        thisArg: unknown
    ) {
        if (isGenerator(producer)) {
            return new GenAtom(parentContext, producer, thisArg) as Atom<T>
        }
        return new FunAtom(parentContext, producer, thisArg) as Atom<T>
    }

    protected abstract iterator(): StreamIterator<T>

    readonly context: Context 
    readonly relations: Dependencies
    private cache: Cache<T> | undefined

    constructor(parentContext: Context | null) {
        this.context = new Context(this, parentContext) 
        this.relations = new Dependencies(this)
    }

    get() {
        let cache: Cache<T>
        let atom = this as Atom<T>

        while (true) {
            if (atom.relations.link() || atom.relations.hasConsumers()) {
                if (!atom.hasCache()) {
                    atom.rebuild()
                }
                cache = atom.getCache()!
            } else {
                cache = atom.build() as Cache<T>
            }

            if (cache instanceof Err) {
                throw cache.value
            }

            if (cache.value instanceof Delegation) {
                atom = cache.value.stream.getAtomFor(atom)
                continue
            }

            break
        }

        return cache.value
    }

    build(): Err | Data<T> {
        const iterator = this.iterator()

        let input = undefined

        this.relations.collect()

        while (true) {
            const { done, value } = iterator.next(input)

            if (done) {
                this.relations.normalize()

                return (value as any) as Err | Data<T> // TODO: remove any
            }

            if (value instanceof Mutator) {
                const prevValue = this.hasCache() ? this.getCache()!.value : undefined
                input = value.mutate(prevValue as T | undefined)
                continue
            }

            throw 'What`s up? It shouldn`t have happened'
        }
    }

    rebuild() {
        const oldCache = this.getCache()
        const newCache = this.build()

        if (!newCache.equal(oldCache)) {
            this.setCache(newCache as Cache<T>)

            return true
        }

        return false
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
            this.relations.deleteConsumer(initiator)
        }
        if (!this.relations.hasConsumers()) {
            this.cache = undefined
            this.context.dispose()
            this.relations.dispose()
        }
    }
}

class GenAtom<T> extends Atom<T> {
    private readonly stack: Stack<StreamIterator<T>>
    private readonly producer: (context?: Context) => Generator<T>
    private readonly thisArg: unknown

    constructor(parentContext: Context | null, producer: (context?: Context) => Generator<T>, thisArg: unknown) {
        super(parentContext)
        this.stack = new Stack()
        this.producer = producer
        this.thisArg = thisArg
    }

    protected *iterator(): StreamIterator<T> {
        const { stack, producer, thisArg, context } = this

        if (stack.empty) {
            stack.push(producer.call(thisArg, context) as StreamIterator<T>)
        }

        let input: unknown

        while (true) {
            let done: boolean
            let error: boolean
            let value: Command | Payload<T> | Error

            try {
                const result = stack.peek().next(input)

                value = result.value!
                done = result.done!
                error = false
            } catch (e) {
                value = e as Error
                done = true
                error = true
            }

            if (done) {
                stack.pop()
            }

            if (value instanceof GetConsumer) {
                input = this
                continue
            }

            if (error) {
                input = new Err(value as Error)
            } else if (value instanceof Mutator) {
                input = new Data(yield value)
            } else {
                input = new Data(value)
            }

            if (done && !stack.empty) {
                continue
            }

            return input as Payload<T>
        }
    }

    dispose(initiator?: Atom) {
        super.dispose(initiator)

        while (!this.stack.empty) {
            this.stack.pop()!.return!()
        }
    }
}

class FunAtom<T> extends Atom<T> {
    private readonly producer: (context?: Context) => T
    private readonly thisArg: unknown

    constructor(parentContext: Context | null, producer: (context?: Context) => T, thisArg: unknown) {
        super(parentContext)
        this.producer = producer
        this.thisArg = thisArg
    }

    protected *iterator(): StreamIterator<T> {
        const { producer, thisArg, context } = this

        let error: boolean
        let value: Command | Payload<T> | Error

        try {
            value = producer.call(thisArg, context)
            error = false
        } catch (e) {
            value = e as Error
            error = true
        }

        if (error) {
            return new Err(value as Error) as any
        } else if (value instanceof Mutator) {
            return new Data(yield value) as any
        } else {
            return new Data(value) as any
        }
    }
}
