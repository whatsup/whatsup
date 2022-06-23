import { Payload } from './atom'
import { Computed } from './computed'
import { transaction } from './scheduler'

export class Observable<T = unknown> extends Computed<T> {
    private value: Payload<T>

    constructor(value: Payload<T>) {
        super(() => this.value)
        this.value = value
    }

    set(value: Payload<T>) {
        this.value = value

        if (this.atom.hasObservers()) {
            transaction((t) => t.addEntry(this.atom))
        }
    }
}

interface ObservableFactory {
    <T>(value?: Payload<T>): Observable<T>
    (target: Object, prop: string): void
}

export const observable: ObservableFactory = <T>(...args: any[]): any => {
    if (args.length <= 1) {
        const [value] = args as [T]

        return new Observable<T>(value)
    }

    const [target, prop] = args as [Object, string]
    const key = Symbol(`Observable ${prop}`)
    const field = function (this: any) {
        return key in this ? this[key] : (this[key] = observable())
    }

    Object.defineProperties(target, {
        [prop]: {
            get() {
                return field.call(this).get()
            },
            set(value: T) {
                field.call(this).set(value)
            },
            configurable: false,
        },
    })
}
