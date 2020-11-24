export abstract class Cache<T = any> {
    readonly value: T

    constructor(value: T) {
        this.value = value
    }

    equal(cache: Cache | undefined) {
        return cache != null && cache instanceof this.constructor && cache.value === this.value
    }
}

export class ErrorCache extends Cache<Error> {}
export class DataCache<T> extends Cache<T> {}
