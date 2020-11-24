import { Factor } from './factor'
import { Event, EventCtor, EventListener } from './event'
import { Atom, FractalAtom } from './atom'

export class Controller {
    private readonly atom: Atom

    constructor(atom: Atom) {
        this.atom = atom
    }

    update() {
        this.atom.update()
    }

    destroy() {}
}

export class ContextController extends Controller {
    /**@internal */
    readonly parent: ContextController | null

    private factors!: WeakMap<Factor<any>, any>
    private listeners!: WeakMap<EventCtor, Set<EventListener>>

    constructor(atom: FractalAtom, parent: ContextController | null) {
        super(atom)
        this.parent = parent
    }

    /**@internal */
    getFactors() {
        return this.factors
    }

    /**@internal */
    destroy() {
        this.factors = undefined!
        this.listeners = undefined!
    }

    get<T>(factor: Factor<T>): T | undefined {
        let { parent } = this

        while (parent) {
            const factors = parent.getFactors()

            if (factors && factors.has(factor)) {
                return factors.get(factor)
            }

            parent = parent.parent
        }

        return factor.defaultValue
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

        if (this.parent && !event.isPropagationStopped()) {
            this.parent.dispath(event)
        }
    }
}
