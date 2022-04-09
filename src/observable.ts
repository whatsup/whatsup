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

export const observable = <T>(value: T) => {
    return new Observable(value)
}
