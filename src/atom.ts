import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { isGenerator } from './utils'

export type Payload<T> = T | Delegation<T> | Mutator<T>
export type PayloadIterator<T> = Iterator<Payload<T> | never, Payload<T> | unknown, unknown>
export type GnProducer<T> = () => PayloadIterator<T>
export type FnProducer<T> = () => Payload<T>
export type Producer<T> = GnProducer<T> | FnProducer<T>
export type Cache<T> = T | Delegation<T> | Error

export enum CacheState {
    Actual = 'Actual',
    Check = 'Check',
    Dirty = 'Dirty',
}

export enum CacheType {
    Empty = 'Empty',
    Data = 'Data',
    Error = 'Error',
}

const RELATIONS_STACK = [] as Atom[]

export abstract class Atom<T = any> {
    protected abstract produce(): Payload<T>

    readonly observers: Set<Atom>
    private dependencies: Set<Atom>
    private disposeCandidates: Set<Atom>
    private disposeListeners?: ((cache: Cache<T>) => void)[]
    private cache?: Cache<T>
    private cacheType = CacheType.Empty
    private cacheState = CacheState.Dirty

    constructor() {
        this.observers = new Set<Atom>()
        this.dependencies = new Set<Atom>()
        this.disposeCandidates = new Set<Atom>()
    }

    get() {
        let cache: Cache<T>
        let atom = this as Atom<T>

        while (true) {
            if (atom.establishRelations() || atom.hasObservers()) {
                if (atom.cacheState !== CacheState.Actual) {
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
                atom = cache.source.atom
                continue
            }

            break
        }

        return cache as T
    }

    build() {
        let value: Payload<T> | Error
        let error: boolean

        try {
            value = this.produce()
            error = false

            if (value instanceof Mutator) {
                value = value.mutate(this.cache as T)
            }
        } catch (e) {
            value = e as Error
            error = true
        }

        if (error) {
            throw value
        }

        return value as T | Delegation<T>
    }

    rebuild() {
        check: if (this.isCacheState(CacheState.Check)) {
            for (const dependency of this.dependencies) {
                if (dependency.rebuild()) {
                    break check
                }
            }
        }

        if (this.isCacheState(CacheState.Dirty)) {
            this.trackRelations()

            let newCache: Cache<T>
            let newCacheType: CacheType

            try {
                newCache = this.build()
                newCacheType = CacheType.Data
            } catch (e) {
                newCache = e as Error
                newCacheType = CacheType.Error
            }

            this.untrackRelations()

            if (this.cache !== newCache || this.cacheType !== newCacheType) {
                this.cache = newCache
                this.cacheType = newCacheType

                for (const observer of this.observers) {
                    observer.setCacheState(CacheState.Dirty)
                }

                this.setCacheState(CacheState.Actual)

                return true
            }
        }

        this.setCacheState(CacheState.Actual)

        return false
    }

    setCacheState(state: CacheState) {
        this.cacheState = state
    }

    isCacheState(state: CacheState) {
        return this.cacheState === state
    }

    hasObservers() {
        return this.observers.size > 0
    }

    addObserver(atom: Atom) {
        this.observers.add(atom)
    }

    deleteObserver(atom: Atom) {
        this.observers.delete(atom)
    }

    addDependency(atom: Atom) {
        this.dependencies.add(atom)
        this.disposeCandidates.delete(atom)

        atom.addObserver(this)
    }

    trackRelations() {
        const { dependencies, disposeCandidates } = this

        this.dependencies = disposeCandidates
        this.disposeCandidates = dependencies

        RELATIONS_STACK.push(this)
    }

    establishRelations() {
        if (RELATIONS_STACK.length > 0) {
            const observer = RELATIONS_STACK[RELATIONS_STACK.length - 1]

            observer.addDependency(this)

            return true
        }

        return false
    }

    untrackRelations() {
        RELATIONS_STACK.pop()!

        for (const dependency of this.disposeCandidates) {
            dependency.dispose(this)
        }

        this.disposeCandidates.clear()
    }

    onDispose(listener: (cache: Cache<T>) => void) {
        if (!this.disposeListeners) {
            this.disposeListeners = []
        }
        this.disposeListeners.push(listener)
    }

    dispose(initiator?: Atom) {
        if (initiator) {
            this.deleteObserver(initiator)
        }

        if (!this.hasObservers()) {
            if (this.disposeListeners) {
                for (const listener of this.disposeListeners) {
                    listener(this.cache!)
                }

                this.disposeListeners = undefined
            }

            this.cache = undefined
            this.cacheType = CacheType.Empty
            this.cacheState = CacheState.Dirty

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

    protected produce(): Payload<T> {
        const { producer, thisArg } = this

        if (!this.iterator) {
            this.iterator = producer.call(thisArg) as PayloadIterator<T>
        }

        try {
            const { done, value } = this.iterator!.next()

            if (done) {
                this.iterator = undefined
            }

            return value as Payload<T>
        } catch (e) {
            this.iterator = undefined

            throw e as Error
        }
    }

    dispose(initiator?: Atom) {
        super.dispose(initiator)

        if (!this.hasObservers() && this.iterator) {
            this.iterator.return!()
            this.iterator = undefined
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

    protected produce(): Payload<T> {
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
