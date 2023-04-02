import { createAtom, Payload } from './atom'
import { Computed } from './computed'
import { build } from './builder'

const SIGN = Symbol('This is observable')

export interface Observable<T = unknown> extends Computed<T> {
    (value: Payload<T>): void
}

interface ObservableFactory {
    <T>(value?: Payload<T>): Observable<T>
    (target: Object, prop: string): void
}

export const observable: ObservableFactory = <T>(...args: any[]): any => {
    if (args.length <= 1) {
        let [value] = args as [T]

        const producer = () => value
        const atom = createAtom(producer)
        const accessor = (...args: [T]) => {
            if (args.length === 1) {
                value = args[0]

                if (atom.hasTargets()) {
                    build((addEntry) => addEntry(atom))
                }

                return
            } else {
                return atom.get()
            }
        }

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

    const [, prop, descriptor] = args as [Object, string, PropertyDescriptor & { initializer: () => T }]
    const key = Symbol(`Observable ${prop}`)
    const field = function (this: any) {
        return key in this ? this[key] : (this[key] = observable(descriptor.initializer?.call(this) ?? undefined))
    }

    return {
        get() {
            return field.call(this)()
        },
        set(value: T) {
            return field.call(this)(value)
        },
        configurable: false,
    }
}

export const isObservable = <T = unknown>(target: any): target is Observable<T> => {
    return typeof target === 'function' && Reflect.has(target, SIGN)
}
