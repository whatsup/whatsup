import { FnProducer, GnProducer, Payload, Producer, PayloadIterator } from './atomic'
import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { isGenerator } from './utils'

type Cache<T> = T | Delegation<T> | Error

enum CacheType {
    Empty = 'Empty',
    Data = 'Data',
    Error = 'Error',
}

const WATCH_STACK = [] as Set<Atom>[]

export abstract class Atom<T = any> {
    protected abstract builder(): PayloadIterator<T>

    readonly consumers: Set<Atom>

    private dependencies: Set<Atom>
    private garbage: Set<Atom>
    private cache?: Cache<T>
    private cacheType = CacheType.Empty

    constructor() {
        this.consumers = new Set<Atom>()
        this.dependencies = new Set<Atom>()
        this.garbage = new Set<Atom>()
    }

    get() {
        let cache: Cache<T>
        let atom = this as Atom<T>

        while (true) {
            if (atom.link() || atom.hasConsumers()) {
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

        this.collect()

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

        if (value instanceof Mutator) {
            value = value.mutate(this.cache as T)
        }

        if (done) {
            this.normalize()
        } else {
            throw 'What`s up? It shouldn`t have happened'
        }

        if (error) {
            throw value
        }

        return value as T | Delegation<T>
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

    hasConsumers() {
        return this.consumers.size > 0
    }

    addConsumer(atom: Atom) {
        this.consumers.add(atom)
    }

    deleteConsumer(atom: Atom) {
        this.consumers.delete(atom)
    }

    collect() {
        const { dependencies, garbage } = this

        this.dependencies = garbage
        this.garbage = dependencies

        WATCH_STACK.push(new Set())
    }

    link() {
        if (WATCH_STACK.length > 0) {
            WATCH_STACK[WATCH_STACK.length - 1].add(this)
            return true
        }

        return false
    }

    normalize() {
        const atoms = WATCH_STACK.pop()!

        for (const dependency of atoms) {
            this.dependencies.add(dependency)
            this.garbage.delete(dependency)

            dependency.addConsumer(this)
        }

        for (const dependency of this.garbage) {
            dependency.dispose(this)
        }

        this.garbage.clear()
    }

    dispose(initiator?: Atom) {
        if (initiator) {
            this.deleteConsumer(initiator)
        }

        if (!this.hasConsumers()) {
            this.cache = undefined
            this.cacheType = CacheType.Empty

            for (const atom of this.dependencies) {
                atom.dispose(this)
            }

            this.dependencies.clear()
        }
    }
}

class GnAtom<T> extends Atom<T> {
    private readonly producer: GnProducer<T>
    private readonly thisArg: unknown
    private iterator?: PayloadIterator<T>

    constructor(producer: GnProducer<T>, thisArg: unknown) {
        super()

        this.producer = producer
        this.thisArg = thisArg
    }

    protected *builder(): PayloadIterator<T> {
        const { producer, thisArg } = this

        if (!this.iterator) {
            this.iterator = producer.call(thisArg) as PayloadIterator<T>
        }

        let input: unknown

        while (true) {
            try {
                const { done, value } = this.iterator!.next(input)

                if (done) {
                    this.iterator = undefined
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
    private readonly producer: FnProducer<T>
    private readonly thisArg: unknown

    constructor(producer: FnProducer<T>, thisArg: unknown) {
        super()

        this.producer = producer
        this.thisArg = thisArg
    }

    protected *builder(): PayloadIterator<T> {
        const { producer, thisArg } = this

        return producer.call(thisArg)
    }
}

export const createAtom = <T>(producer: Producer<T>, thisArg: unknown = undefined) => {
    if (isGenerator(producer)) {
        return new GnAtom(producer as GnProducer<T>, thisArg) as Atom<T>
    }

    return new FnAtom(producer as FnProducer<T>, thisArg) as Atom<T>
}
