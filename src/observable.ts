import { Computed } from './computed'

export class Observable<T> extends Computed<T> {
    private value: T

    constructor(value: T) {
        super()
        this.value = value
    }

    *stream() {
        while (true) {
            yield this.value
        }
    }

    get() {
        return this.value
    }

    set(value: T) {
        this.value = value
        this.atom.update()
    }
}

export function observable<T>(value: T) {
    return new Observable(value)
}
