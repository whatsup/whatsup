export abstract class Result<T = unknown> {
    readonly value: T

    constructor(value: T) {
        this.value = value
    }

    equal(result: Result | undefined) {
        return result != null && result instanceof this.constructor && result.value === this.value
    }
}

export class Err extends Result<Error> {}
export class Data<T> extends Result<T> {}
