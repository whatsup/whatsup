import { Atom } from './atom'
import { Factor } from './factor'
import { Event, EventCtor, EventListener } from './event'

export class Context {
    private readonly atom: Atom
    private factors!: WeakMap<Factor<any>, any>
    private eventListeners!: WeakMap<EventCtor, Set<EventListener>>

    constructor(atom: Atom) {
        this.atom = atom
    }

    update() {
        return this.atom.update()
    }

    /** @internal */
    get parent(): Context | null {
        const { consumer, delegator } = this.atom
        return delegator?.context || consumer?.context || null
    }

    extract<T>(factor: Factor<T>): T | undefined {
        if (this.factors && this.factors.has(factor)) {
            return this.factors.get(factor)
        }

        return
    }

    get<T>(factor: Factor<T>): T | undefined {
        const { parent } = this

        if (parent) {
            return parent.extract(factor) || parent.get(factor)
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
        if (!this.eventListeners) {
            this.eventListeners = new WeakMap()
        }
        if (!this.eventListeners.has(ctor)) {
            this.eventListeners.set(ctor, new Set())
        }

        this.eventListeners.get(ctor)!.add(listener)

        return () => this.off(ctor, listener)
    }

    off<T extends Event>(ctor: EventCtor<T>, listener?: EventListener<T>) {
        if (this.eventListeners) {
            if (this.eventListeners.has(ctor)) {
                if (listener) {
                    this.eventListeners.get(ctor)!.delete(listener)
                } else {
                    this.eventListeners.delete(ctor)
                }
            }
        }
    }

    dispath<T extends Event>(event: T) {
        const ctor = event.constructor as EventCtor<T>

        if (this.eventListeners && this.eventListeners.has(ctor)) {
            const listeners = this.eventListeners.get(ctor)!

            for (const listener of listeners) {
                listener(event)

                if (event.isPropagationImmediateStopped()) {
                    break
                }
            }
        }

        const { parent } = this

        if (parent && !event.isPropagationStopped()) {
            parent.dispath(event)
        }
    }
}
