import { Context } from './context'
import { Relations } from './relations'
import { Data, Err } from './data'
import { Delegation } from './delegation'
import { FunProducer, GenProducer, Payload, Producer, StreamIterator } from './stream'
import { Mutator } from './mutator'
import { isGenerator } from './utils'
import { GET_CONSUMER } from './symbols'

export abstract class Atom<T = unknown> {
    protected abstract iterator(): StreamIterator<T>
    readonly context: Context
    readonly relations: Relations
    private cache: Data<T> | undefined

    constructor(parentCtx: Context | null) {
        this.context = new Context(this, parentCtx)
        this.relations = new Relations(this)
    }

    get() {
        let cache: Data<T>
        let atom = this as Atom<T>

        while (true) {
            if (atom.relations.link() || atom.relations.hasConsumers()) {
                if (atom.cache === undefined) {
                    atom.rebuild()
                }
                cache = atom.cache!
            } else {
                cache = atom.build()
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

    build(): Data<T> {
        const iterator = this.iterator()

        let input = undefined

        this.relations.collect()

        while (true) {
            const { done, value } = iterator.next(input)

            if (done) {
                this.relations.normalize()

                return (value as any) as Data<T> // TODO: remove any
            }

            if (value instanceof Mutator) {
                input = value.mutate(this.cache?.value)
                continue
            }

            throw 'What`s up? It shouldn`t have happened'
        }
    }

    rebuild() {
        const newCache = this.build()

        if (
            this.cache === undefined ||
            this.cache.constructor !== newCache.constructor ||
            this.cache.value !== newCache.value
        ) {
            this.cache = newCache

            return true
        }

        return false
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
    private readonly stack: StreamIterator<T>[]
    private readonly producer: GenProducer<T>
    private readonly thisArg: unknown

    constructor(parentCtx: Context | null, producer: GenProducer<T>, thisArg: unknown) {
        super(parentCtx)

        this.stack = []
        this.producer = producer
        this.thisArg = thisArg
    }

    protected *iterator(): StreamIterator<T> {
        const { stack, producer, thisArg, context } = this

        if (stack.length == 0) {
            stack.push(producer.call(thisArg, context) as StreamIterator<T>)
        }

        let input: unknown

        while (true) {
            let done: boolean
            let error: boolean
            let value: Symbol | Payload<T> | Error

            try {
                const iterator = stack[stack.length - 1]
                const result = iterator.next(input)

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

            if (value === GET_CONSUMER) {
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

            if (done && stack.length > 0) {
                continue
            }

            return input as Payload<T>
        }
    }

    dispose(initiator?: Atom) {
        super.dispose(initiator)

        while (this.stack.length > 0) {
            this.stack.pop()!.return!()
        }
    }
}

class FunAtom<T> extends Atom<T> {
    private readonly producer: FunProducer<T>
    private readonly thisArg: unknown

    constructor(parentCtx: Context | null, producer: FunProducer<T>, thisArg: unknown) {
        super(parentCtx)

        this.producer = producer
        this.thisArg = thisArg
    }

    protected *iterator(): StreamIterator<T> {
        const { producer, thisArg, context } = this

        let error: boolean
        let value: Payload<T> | Error

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

export const atom = <T>(parentCtx: Context | null, producer: Producer<T>, thisArg: unknown) => {
    if (isGenerator(producer)) {
        return new GenAtom(parentCtx, producer, thisArg) as Atom<T>
    }

    return new FunAtom(parentCtx, producer, thisArg) as Atom<T>
}
