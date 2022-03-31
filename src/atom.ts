import { FunProducer, GenProducer, Payload, Producer, StreamIterator } from './stream'
import { Context } from './context'
import { Relations } from './relations'
import { Data, Err } from './data'
import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { isGenerator } from './utils'
import { GET_CONSUMER } from './symbols'

type AtomCache<T> = Data<T | Delegation<T>> | Err

export abstract class Atom<T = unknown> {
    protected abstract builder(): StreamIterator<T>
    readonly context: Context
    readonly relations: Relations
    private cache: AtomCache<T> | undefined

    constructor(parentCtx: Context | null) {
        this.context = new Context(this, parentCtx)
        this.relations = new Relations(this)
    }

    get() {
        let cache: AtomCache<T>
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

    build() {
        const iterator = this.builder()

        let input = undefined

        this.relations.collect()

        while (true) {
            let done: boolean
            let error: boolean
            let value: Symbol | Payload<T> | Error

            try {
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
                this.relations.normalize()
            } else {
                throw 'What`s up? It shouldn`t have happened'
            }

            if (error) {
                return new Err(value as Error)
            } else if (value instanceof Mutator) {
                return new Data(value.mutate(this.cache?.value as T)) as AtomCache<T>
            } else {
                return new Data(value) as AtomCache<T>
            }
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
    private readonly producer: GenProducer<T>
    private readonly thisArg: unknown
    private iterator?: StreamIterator<T>

    constructor(parentCtx: Context | null, producer: GenProducer<T>, thisArg: unknown) {
        super(parentCtx)

        this.producer = producer
        this.thisArg = thisArg
    }

    protected *builder(): StreamIterator<T> {
        const { producer, thisArg, context } = this

        if (!this.iterator) {
            this.iterator = producer.call(thisArg, context) as StreamIterator<T>
        }

        let input: unknown

        while (true) {
            try {
                const { done, value } = this.iterator!.next(input)

                if (done) {
                    this.iterator = undefined
                }

                if (value === GET_CONSUMER) {
                    input = this
                    continue
                }

                return value as Payload<T>
            } catch (e) {
                this.iterator = undefined

                throw e as Error
            }
        }
    }

    dispose(initiator?: Atom) {
        super.dispose(initiator)

        if (this.iterator) {
            this.iterator!.return!()
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

    protected *builder(): StreamIterator<T> {
        const { producer, thisArg, context } = this

        return producer.call(thisArg, context)
    }
}

export const atom = <T>(parentCtx: Context | null, producer: Producer<T>, thisArg: unknown) => {
    if (isGenerator(producer)) {
        return new GenAtom(parentCtx, producer as GenProducer<T>, thisArg) as Atom<T>
    }

    return new FunAtom(parentCtx, producer as FunProducer<T>, thisArg) as Atom<T>
}
