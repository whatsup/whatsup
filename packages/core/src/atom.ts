import { Mutator, isMutator } from './mutator'
import { isGenerator } from './utils'

export const DIRTY = 1 << 0
export const CHECK = 1 << 1
export const ACTUAL = 1 << 2
export const HAS_ERROR = 1 << 3
export const SYNCHRONIZER = 1 << 4
export const BUILDING = 1 << 5

export type Payload<T> = T | Mutator<T>
export type PayloadIterator<T> = Iterator<Payload<T> | never, Payload<T> | unknown, unknown>
export type GnProducer<T> = () => PayloadIterator<T>
export type FnProducer<T> = () => Payload<T>
export type Producer<T> = GnProducer<T> | FnProducer<T>
export type Cache<T> = T | Error

export type Node = {
    source: Atom
    target: Atom
    synchronizer: boolean
    prevSource?: Node
    nextSource?: Node
    prevTarget?: Node
    nextTarget?: Node
}

let evalContext = null as Atom | null

export abstract class Atom<T = any> {
    protected abstract produce(): Payload<T>

    /* @internal */ state = DIRTY
    /* @internal */ contextNode?: Node = undefined
    /* @internal */ sourcesHead?: Node = undefined
    /* @internal */ sourcesTail?: Node = undefined
    /* @internal */ targetsHead?: Node = undefined
    /* @internal */ targetsTail?: Node = undefined

    private disposeListeners?: ((cache: Cache<T>) => void)[] = undefined
    private cache?: Cache<T> = undefined

    get() {
        if (this.establishRelations() || this.hasTargets()) {
            if (!this.isCacheState(ACTUAL)) {
                this.rebuild()
            }

            if (this.state & HAS_ERROR) {
                throw this.cache
            }

            return this.cache as T
        }

        return this.build()
    }

    build() {
        if (this.state & BUILDING) {
            throw new Error('Cycle detected')
        }

        this.state ^= BUILDING

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

        this.state ^= BUILDING

        if (error) {
            throw value
        }

        return value as T
    }

    rebuild() {
        let isCheck = this.isCacheState(CHECK)

        for (let node = this.sourcesHead; node; node = node.nextSource) {
            node.source.contextNode = node

            if (isCheck && node.source.rebuild()) {
                isCheck = false
            }
        }

        if (this.isCacheState(DIRTY)) {
            const context = this.trackRelations()

            let newCache: Cache<T>
            let hasError: boolean

            try {
                newCache = this.build()
                hasError = false
            } catch (e) {
                newCache = e as Error
                hasError = true
            }

            this.untrackRelations(context)

            if (this.cache !== newCache || !!(this.state & HAS_ERROR) !== hasError) {
                this.cache = newCache
                this.state = hasError ? this.state | HAS_ERROR : this.state & ~HAS_ERROR

                for (let node = this.targetsHead; node; node = node.nextTarget) {
                    node.target.setCacheState(DIRTY)
                }

                this.setCacheState(ACTUAL)

                return true
            }
        }

        this.setCacheState(ACTUAL)

        return false
    }

    setCacheState(state: number) {
        this.state = ((this.state >> 3) << 3) | state
    }

    isCacheState(state: number) {
        return !!(this.state & state)
    }

    hasTargets() {
        return !!(this.targetsHead && this.targetsTail)
    }

    private trackRelations() {
        this.state ^= SYNCHRONIZER

        const prevEvalContext = evalContext

        evalContext = this

        return prevEvalContext
    }

    private establishRelations() {
        if (!evalContext) {
            return false
        }

        const node = this.contextNode
        const synchronizer = !!(evalContext.state & SYNCHRONIZER)

        if (!node || node.target !== evalContext) {
            const node = {
                source: this,
                target: evalContext,
                synchronizer: synchronizer,
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
        } else if (node.synchronizer !== synchronizer) {
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

            node.synchronizer = synchronizer
        }

        this.contextNode = undefined

        return true
    }

    private untrackRelations(prevEvalContext: Atom | null) {
        evalContext = prevEvalContext

        const synchronizer = !!(this.state & SYNCHRONIZER)

        for (let node = this.sourcesHead; node; node = node.nextSource) {
            if (node.prevSource) {
                node.prevSource.nextSource = undefined
                node.prevSource = undefined
            }

            if (node.synchronizer === synchronizer) {
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
        }

        if (!this.hasTargets()) {
            if (this.disposeListeners) {
                for (const listener of this.disposeListeners) {
                    listener(this.cache!)
                }
            }

            for (let node = this.sourcesHead; node; node = node.nextSource) {
                node.source.dispose(node)
            }

            this.state = DIRTY
            this.cache = undefined
            this.sourcesHead = undefined
            this.sourcesTail = undefined
            this.contextNode = undefined
            this.disposeListeners = undefined
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

        if (!this.hasTargets() && this.iterator) {
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
