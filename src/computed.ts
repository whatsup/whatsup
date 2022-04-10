import { createAtom, Atom, Producer } from './atom'
import { Atomic } from './atomic'

export class Computed<T = unknown> implements Atomic<T> {
    /* @internal */
    readonly atom: Atom<T>

    constructor(producer: Producer<T>, thisArg?: unknown) {
        this.atom = createAtom(producer, thisArg)
    }

    get() {
        return this.atom.get()
    }
}

interface ComputedFactory {
    <T>(producer: Producer<T>, thisArg?: unknown): Computed<T>
    (target: Object, prop: string, descriptor: PropertyDescriptor): void
}

export const computed: ComputedFactory = <T>(...args: any[]): any => {
    if (typeof args[0] === 'function') {
        const [producer, thisArg] = args as [Producer<T>, unknown]

        return new Computed(producer, thisArg)
    }

    const [, prop, descriptor] = args as [Object, string, PropertyDescriptor]
    const producer = descriptor.get as Producer<T>
    const key = Symbol(`Computed ${prop}`)
    const field = function (this: any) {
        return key in this ? this[key] : (this[key] = computed(producer, this))
    }

    return {
        get() {
            return field.call(this).get()
        },
        configurable: false,
    }
}
