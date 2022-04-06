import { FunProducer, GenProducer, Payload, Producer, StreamIterator } from './stream'
import { Relations } from './relations'
import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { isGenerator } from './utils'

type Cache<T> = T | Delegation<T> | Error

enum CacheType {
    Empty = 'Empty',
    Data = 'Data',
    Error = 'Error',
}

export const GET_CONSUMER = Symbol('Get up-level atom (consumer)')

export abstract class Atom<T = unknown> {
    protected abstract builder(): StreamIterator<T>
    readonly relations: Relations
    private cache?: Cache<T>
    private cacheType = CacheType.Empty

    constructor() {
        this.relations = new Relations(this)
    }

    get() {
        let cache: Cache<T>
        let atom = this as Atom<T>

        while (true) {
            if (atom.relations.link() || atom.relations.hasConsumers()) {
                if (atom.cacheType === CacheType.Empty) {
                    atom.rebuild()
                }

                if (atom.cacheType === CacheType.Error) {
                    throw atom.cache
                }

                cache = atom.cache!
            } else {
                cache = atom.build()
            }

            if (cache instanceof Delegation) {
                atom = cache.stream.atom
                continue
            }

            break
        }

        return cache as T
    }

    build() {
        const iterator = this.builder()

        let input = undefined

        this.relations.collect()

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
            throw value
        } else if (value instanceof Mutator) {
            return value.mutate(this.cache as T)
        } else {
            return value as T | Delegation<T>
        }
    }

    rebuild() {
        let newCacheType: CacheType
        let newCache: Cache<T>

        try {
            newCache = this.build()
            newCacheType = CacheType.Data
        } catch (e) {
            newCache = e as Error
            newCacheType = CacheType.Error
        }

        if (this.cache === undefined || this.cacheType !== newCacheType || this.cache !== newCache) {
            this.cache = newCache
            this.cacheType = newCacheType

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
            this.cacheType = CacheType.Empty
            this.relations.dispose()
        }
    }
}

class GnAtom<T> extends Atom<T> {
    private readonly producer: GenProducer<T>
    private readonly thisArg: unknown
    private iterator?: StreamIterator<T>

    constructor(producer: GenProducer<T>, thisArg: unknown) {
        super()

        this.producer = producer
        this.thisArg = thisArg
    }

    protected *builder(): StreamIterator<T> {
        const { producer, thisArg } = this

        if (!this.iterator) {
            this.iterator = producer.call(thisArg) as StreamIterator<T>
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

class FnAtom<T> extends Atom<T> {
    private readonly producer: FunProducer<T>
    private readonly thisArg: unknown

    constructor(producer: FunProducer<T>, thisArg: unknown) {
        super()

        this.producer = producer
        this.thisArg = thisArg
    }

    protected *builder(): StreamIterator<T> {
        const { producer, thisArg } = this

        return producer.call(thisArg)
    }
}

export const createAtom = <T>(producer: Producer<T>, thisArg: unknown) => {
    if (isGenerator(producer)) {
        return new GnAtom(producer as GenProducer<T>, thisArg) as Atom<T>
    }

    return new FnAtom(producer as FunProducer<T>, thisArg) as Atom<T>
}
