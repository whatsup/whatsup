export class Data<T = unknown> {
    readonly value: T

    constructor(value: T) {
        this.value = value
    }
}

export class Err extends Data<Error> {}
