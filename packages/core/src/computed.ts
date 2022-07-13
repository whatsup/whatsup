import { createAtom, Producer } from './atom'
import { Atomic } from './atomic'

const SIGN = Symbol('This is computed')

export interface Computed<T = unknown> extends Atomic<T> {
    (): T
}

export interface ComputedFactory {
    <T>(producer: Producer<T>, thisArg?: unknown): Computed<T>
    (target: Object, prop: string, descriptor: PropertyDescriptor): void
}

export const computed: ComputedFactory = <T>(...args: any[]): any => {
    if (typeof args[0] === 'function') {
        const [producer, thisArg] = args as [Producer<T>, unknown]
        const atom = createAtom(producer, thisArg)
        const accessor = () => atom.get()

        Object.defineProperties(accessor, {
            atom: {
                value: atom,
                writable: false,
                enumerable: false,
                configurable: false,
            },
            [SIGN]: {
                value: true,
                writable: false,
                enumerable: false,
                configurable: false,
            },
        })

        return accessor as Computed<T>
    }

    const [, prop, descriptor] = args as [Object, string, PropertyDescriptor]
    const producer = descriptor.get as Producer<T>
    const key = Symbol(`Computed ${prop}`)
    const field = function (this: any) {
        return key in this ? this[key] : (this[key] = computed(producer, this))
    }

    return {
        get() {
            return field.call(this)()
        },
        configurable: false,
    }
}

export const isComputed = <T = unknown>(target: any): target is Computed<T> => {
    return typeof target === 'function' && Reflect.has(target, SIGN)
}
