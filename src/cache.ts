export abstract class Cache<T = unknown> {
    readonly value: T

    constructor(value: T) {
        this.value = value
    }

    equal(result: Cache | undefined) {
        return result != null && result instanceof this.constructor && result.value === this.value
    }
}

export class Err extends Cache<Error> {}
export class Data<T> extends Cache<T> {}
