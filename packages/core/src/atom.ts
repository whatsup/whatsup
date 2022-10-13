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
    Data = 'Data',
    Error = 'Error',
}

const RELATIONS_STACK = [] as Atom[]

export abstract class Atom<T = any> {
    protected abstract produce(): Payload<T>

    private observer?: Atom
    private observers?: Set<Atom>
    private dependencies?: Set<Atom>
    private oldDependencies?: Set<Atom>
    private disposeListeners?: ((cache: Cache<T>) => void)[]
    private cache?: Cache<T>
    private cacheType?: CacheType
    private cacheState = CacheState.Dirty

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
            if (this.dependencies) {
                for (const dependency of this.dependencies) {
                    if (dependency.rebuild()) {
                        break check
                    }
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

                for (const observer of this.eachObservers()) {
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
        return !!this.observer || !!this.observers
    }

    *eachObservers() {
        if (this.observers) {
            yield* this.observers
        } else if (this.observer) {
            yield this.observer
        }
    }

    addObserver(atom: Atom) {
        if (this.observers) {
            this.observers.add(atom)
        } else if (this.observer) {
            if (this.observer !== atom) {
                this.observers = new Set([this.observer, atom])
                this.observer = undefined
            }
        } else {
            this.observer = atom
        }
    }

    deleteObserver(atom: Atom) {
        if (this.observers) {
            this.observers.delete(atom)

            if (this.observers.size === 1) {
                this.observer = this.observers.values().next().value
                this.observers = undefined
            }
        } else if (this.observer === atom) {
            this.observer = undefined
        }
    }

    addDependency(atom: Atom) {
        if (!this.dependencies) {
            this.dependencies = new Set()
        }

        this.dependencies.add(atom)

        if (this.oldDependencies) {
            this.oldDependencies.delete(atom)
        }
    }

    private trackRelations() {
        this.oldDependencies = this.dependencies
        this.dependencies = undefined

        RELATIONS_STACK.push(this)
    }

    private establishRelations() {
        if (RELATIONS_STACK.length > 0) {
            const observer = RELATIONS_STACK[RELATIONS_STACK.length - 1]

            observer.addDependency(this)
            this.addObserver(observer)

            return true
        }

        return false
    }

    private untrackRelations() {
        RELATIONS_STACK.pop()!

        if (this.oldDependencies) {
            for (const dependency of this.oldDependencies) {
                dependency.dispose(this)
            }

            this.oldDependencies = undefined
        }
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
            this.cacheType = undefined
            this.cacheState = CacheState.Dirty

            if (this.dependencies) {
                for (const dependency of this.dependencies) {
                    dependency.dispose(this)
                }

                this.dependencies = undefined
            }
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
