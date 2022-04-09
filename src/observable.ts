import { Computed } from './computed'
import { transaction } from './scheduler'

export class Observable<T = unknown> extends Computed<T> {
    private value: T

    constructor(value: T) {
        super(() => this.value)
        this.value = value
    }

    set(value: T) {
        this.value = value

        transaction((t) => t.addEntry(this.atom))
    }
}

interface ObservableFactory {
    <T>(value?: T): Observable<T>
    (target: Object, prop: string): void
}

export const observable: ObservableFactory = <T>(...args: any[]): any => {
    if (args.length <= 1) {
        const [value] = args as [T]

        return new Observable<T>(value)
    }

    const [target, prop] = args as [Object, string]
    const key = Symbol(`Observable ${prop}`)

    Object.defineProperties(target, {
        [prop]: {
            get() {
                return this[key].get()
            },
            set(value: T) {
                this[key].set(value)
            },
            configurable: false,
        },
        [key]: {
            value: observable(),
            writable: false,
            enumerable: true,
            configurable: false,
        },
    })
}
