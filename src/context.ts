import { Factor } from './factor'
import { Event, EventCtor, EventListener } from './event'
import { Atom, FractalAtom } from './atom'

export class RootContext {
    /**@internal */
    readonly parent: Context | RootContext | null = null

    private readonly atom: Atom
    protected factors!: WeakMap<Factor<any>, any>
    protected listeners!: WeakMap<EventCtor, Set<EventListener>>

    constructor(atom: Atom) {
        this.atom = atom
    }

    /**@internal */
    getFactors() {
        return this.factors
    }

    set<T>(factor: Factor<T>, value: T) {
        if (!this.factors) {
            this.factors = new WeakMap()
        }
        this.factors.set(factor, value)
    }

    on<T extends Event>(ctor: EventCtor<T>, listener: EventListener<T>) {
        if (!this.listeners) {
            this.listeners = new WeakMap()
        }
        if (!this.listeners.has(ctor)) {
            this.listeners.set(ctor, new Set())
        }

        this.listeners.get(ctor)!.add(listener)

        return () => this.off(ctor, listener)
    }

    off<T extends Event>(ctor: EventCtor<T>, listener?: EventListener<T>) {
        if (this.listeners) {
            if (this.listeners.has(ctor)) {
                if (listener) {
                    this.listeners.get(ctor)!.delete(listener)
                } else {
                    this.listeners.delete(ctor)
                }
            }
        }
    }

    update() {
        this.atom.update()
    }

    destroy() {
        this.factors = undefined!
        this.listeners = undefined!
    }
}

export class Context extends RootContext {
    /**@internal */
    readonly parent: Context | RootContext

    constructor(atom: FractalAtom, parent: Context | RootContext) {
        super(atom)
        this.parent = parent
    }

    get<T>(factor: Factor<T>): T | undefined {
        let parent = this.parent as RootContext | Context | null

        while (parent) {
            const factors = parent.getFactors()

            if (factors && factors.has(factor)) {
                return factors.get(factor)
            }

            parent = parent.parent
        }

        return factor.defaultValue
    }

    dispath<T extends Event>(event: T) {
        const ctor = event.constructor as EventCtor<T>

        if (this.listeners && this.listeners.has(ctor)) {
            const listeners = this.listeners.get(ctor)!

            for (const listener of listeners) {
                listener(event)

                if (event.isPropagationImmediateStopped()) {
                    break
                }
            }
        }

        if (this.parent instanceof Context && !event.isPropagationStopped()) {
            this.parent.dispath(event)
        }
    }
}
