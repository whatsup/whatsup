import { Cause } from './cause'

export class Conse<T> extends Cause<T> {
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

export function conse<T>(value: T) {
    return new Conse(value)
}
