import { Mutator, isMutator } from './mutator'
import { isGenerator } from './utils'

export type Payload<T> = T | Mutator<T>
export type PayloadIterator<T> = Iterator<Payload<T> | never, Payload<T> | unknown, unknown>
export type GnProducer<T> = () => PayloadIterator<T>
export type FnProducer<T> = () => Payload<T>
export type Producer<T> = GnProducer<T> | FnProducer<T>
export type Cache<T> = T | Error

export type Node = {
    source: Atom
    target: Atom
    version: number
    prevSource?: Node
    nextSource?: Node
    prevTarget?: Node
    nextTarget?: Node
}

export enum CacheState {
    Actual = 'Actual',
    Check = 'Check',
    Dirty = 'Dirty',
}

export enum CacheType {
    Data = 'Data',
    Error = 'Error',
}

let evalContext = null as Atom | null

export abstract class Atom<T = any> {
    protected abstract produce(): Payload<T>

    version = 0
    currentNode?: Node = undefined
    sourcesHead?: Node = undefined
    sourcesTail?: Node = undefined
    targetsHead?: Node = undefined
    targetsTail?: Node = undefined

    private disposeListeners?: ((cache: Cache<T>) => void)[] = undefined
    private cache?: Cache<T> = undefined
    private cacheType?: CacheType = undefined
    private cacheState = CacheState.Dirty

    get() {
        if (this.establishRelations() || this.hasObservers()) {
            if (this.cacheState !== CacheState.Actual) {
                this.rebuild()
            }

            if (this.cacheType === CacheType.Error) {
                throw this.cache
            }

            return this.cache as T
        }

        return this.build()
    }

    build() {
        let value: Payload<T> | Error
        let error: boolean

        try {
            value = this.produce()
            error = false

            if (isMutator<T>(value)) {
                value = value(this.cache as T)
            }
        } catch (e) {
            value = e as Error
            error = true
        }

        if (error) {
            throw value
        }

        return value as T
    }

    rebuild() {
        let isCheck = this.isCacheState(CacheState.Check)

        for (let node = this.sourcesHead; node; node = node.nextSource) {
            node.source.currentNode = node

            if (isCheck && node.source.rebuild()) {
                isCheck = false
            }
        }

        if (this.isCacheState(CacheState.Dirty)) {
            const context = this.trackRelations()

            let newCache: Cache<T>
            let newCacheType: CacheType

            try {
                newCache = this.build()
                newCacheType = CacheType.Data
            } catch (e) {
                newCache = e as Error
                newCacheType = CacheType.Error
            }

            this.untrackRelations(context)

            if (this.cache !== newCache || this.cacheType !== newCacheType) {
                this.cache = newCache
                this.cacheType = newCacheType

                for (let node = this.targetsHead; node; node = node.nextTarget) {
                    node.target.setCacheState(CacheState.Dirty)
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
        return !!this.targetsHead
    }

    private trackRelations() {
        this.version++

        const prevEvalContext = evalContext

        evalContext = this

        return prevEvalContext

        try {
            return evalContext
        } finally {
            evalContext = this
        }
    }

    private establishRelations() {
        if (!evalContext) {
            return false
        }

        if (!this.currentNode || this.currentNode.target !== evalContext) {
            const node = {
                source: this,
                target: evalContext,
                version: this.version,
                prevSource: undefined,
                nextSource: undefined,
                prevTarget: undefined,
                nextTarget: undefined,
            } as Node

            if (this.targetsTail) {
                this.targetsTail.nextTarget = node
                node.prevTarget = this.targetsTail
            }

            this.targetsTail = node

            if (!this.targetsHead) {
                this.targetsHead = node
            }

            if (evalContext.sourcesTail) {
                evalContext.sourcesTail.nextSource = node
                node.prevSource = evalContext.sourcesTail
                evalContext.sourcesTail = node
            } else {
                evalContext.sourcesHead = node
                evalContext.sourcesTail = node
            }

            this.currentNode = node
        }

        const node = this.currentNode // as Node

        this.currentNode = undefined

        if (node.version === evalContext.version) {
            // we already use this atom as source in current target
            return true
        }

        if (node.nextSource) {
            node.nextSource.prevSource = node.prevSource

            if (node.prevSource) {
                node.prevSource.nextSource = node.nextSource
            } else {
                evalContext.sourcesHead = node.nextSource
            }

            node.prevSource = evalContext.sourcesTail
            node.nextSource = undefined

            evalContext.sourcesTail!.nextSource = node
            evalContext.sourcesTail = node
        }

        // sync node actuality version
        node.version = evalContext.version

        return true
    }

    private untrackRelations(atom: Atom | null) {
        evalContext = atom

        // dispose unnecessary nodes

        for (let node = this.sourcesHead; node; node = node.nextSource) {
            if (node.prevSource) {
                node.prevSource.nextSource = undefined
                node.prevSource = undefined
            }

            if (node.version === this.version) {
                this.sourcesHead = node
                break
            } else {
                node.source.dispose(node)
            }
        }
    }

    onDispose(listener: (cache: Cache<T>) => void) {
        if (!this.disposeListeners) {
            this.disposeListeners = []
        }
        this.disposeListeners.push(listener)
    }

    dispose(node?: Node) {
        if (node) {
            if (node.prevTarget) {
                node.prevTarget.nextTarget = node.nextTarget
            } else {
                this.targetsHead = node.nextTarget
            }

            if (node.nextTarget) {
                node.nextTarget.prevTarget = node.prevTarget
            } else {
                this.targetsTail = node.prevTarget
            }

            //  node.version = undefined // ??

            // delete this[node.target.key] // ??
        }

        if (!this.targetsHead && !this.targetsTail) {
            if (this.disposeListeners) {
                for (const listener of this.disposeListeners) {
                    listener(this.cache!)
                }

                this.disposeListeners = undefined
            }

            this.cache = undefined
            this.cacheType = undefined
            this.cacheState = CacheState.Dirty

            for (let node = this.sourcesHead; node; node = node.nextSource) {
                node.source.dispose(node)
            }

            this.sourcesHead = undefined
            this.sourcesTail = undefined
            this.currentNode = undefined
        }
    }
}

class GnAtom<T> extends Atom<T> {
    private readonly producer: GnProducer<T>
    private readonly thisArg: unknown
    private iterator?: PayloadIterator<T> = undefined

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

    dispose(node?: Node) {
        super.dispose(node)

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
