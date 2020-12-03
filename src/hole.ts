import { Singularity } from './singularity'

export class Hole<T> extends Singularity<T> {
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

export function hole<T>(value: T) {
    return new Hole(value)
}
