import { Atom } from './atom'
import { Factor } from './factor'
import { Event, EventCtor, EventListener } from './event'

const $Atom = Symbol('Atom')
const $Factors = Symbol('Factors')
const $EventListeners = Symbol('EventListeners')
const $Parent = Symbol('Parent')

export class Context {
    readonly [$Atom]: Atom;
    [$Factors]!: WeakMap<Factor<any>, any>;
    [$EventListeners]!: WeakMap<EventCtor, Set<EventListener>>

    constructor(atom: Atom) {
        this[$Atom] = atom
    }

    /**@internal */
    destroy() {
        this[$Factors] = undefined!
        this[$EventListeners] = undefined!
    }

    get [$Parent](): Context | null {
        const { consumer, delegator } = this[$Atom]
        return delegator?.context || consumer?.context || null
    }

    update() {
        return this[$Atom].update()
    }

    get<T>(factor: Factor<T>): T | undefined {
        let parent = this[$Parent]

        while (parent) {
            const factors = parent[$Factors]

            if (factors && factors.has(factor)) {
                return factors.get(factor)
            }

            parent = parent[$Parent]
        }

        return factor.defaultValue
    }

    set<T>(factor: Factor<T>, value: T) {
        if (!this[$Factors]) {
            this[$Factors] = new WeakMap()
        }
        this[$Factors].set(factor, value)
    }

    on<T extends Event>(ctor: EventCtor<T>, listener: EventListener<T>) {
        if (!this[$EventListeners]) {
            this[$EventListeners] = new WeakMap()
        }
        if (!this[$EventListeners].has(ctor)) {
            this[$EventListeners].set(ctor, new Set())
        }

        this[$EventListeners].get(ctor)!.add(listener)

        return () => this.off(ctor, listener)
    }

    off<T extends Event>(ctor: EventCtor<T>, listener?: EventListener<T>) {
        if (this[$EventListeners]) {
            if (this[$EventListeners].has(ctor)) {
                if (listener) {
                    this[$EventListeners].get(ctor)!.delete(listener)
                } else {
                    this[$EventListeners].delete(ctor)
                }
            }
        }
    }

    dispath<T extends Event>(event: T) {
        const ctor = event.constructor as EventCtor<T>

        if (this[$EventListeners] && this[$EventListeners].has(ctor)) {
            const listeners = this[$EventListeners].get(ctor)!

            for (const listener of listeners) {
                listener(event)

                if (event.isPropagationImmediateStopped()) {
                    break
                }
            }
        }

        const parent = this[$Parent]

        if (parent && !event.isPropagationStopped()) {
            parent.dispath(event)
        }
    }
}
