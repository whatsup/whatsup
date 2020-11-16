import { Atom } from './atom'
import { Factor } from './factor'
import { Event, EventCtor, EventListener } from './event'

export class Context {
    private readonly atom: Atom
    private eventListeners!: Map<EventCtor, Set<EventListener>>

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

    get<T>(factor: Factor<T>): T | undefined {
        return factor.get(this)
    }

    set<T>(factor: Factor<T>, value: T) {
        factor.set(this, value)
    }

    on<T extends Event>(ctor: EventCtor<T>, listener: EventListener<T>) {
        if (!this.eventListeners) {
            this.eventListeners = new Map()
        }
        if (!this.eventListeners.has(ctor)) {
            this.eventListeners.set(ctor, new Set())
        }

        this.eventListeners.get(ctor)!.add(listener)

        return () => this.off(ctor, listener)
    }

    off<T extends Event>(ctor: EventCtor<T>, listener?: EventListener<T>) {
        if (this.eventListeners) {
            if (listener) {
                if (this.eventListeners.has(ctor)) {
                    this.eventListeners.get(ctor)!.delete(listener)
                }
            } else {
                this.eventListeners.delete(ctor)
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
                    return
                }
            }
        }

        const { parent } = this

        if (parent && !event.isPropagationStopped()) {
            parent.dispath(event)
        }
    }
}
