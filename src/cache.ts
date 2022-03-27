export abstract class Cache<T = unknown> {
    readonly value: T

    constructor(value: T) {
        this.value = value
    }

    equal(cache: Cache | undefined) {
        return cache !== undefined && cache.constructor === this.constructor && cache.value === this.value
    }
}

export class Err extends Cache<Error> {}
export class Data<T> extends Cache<T> {}
