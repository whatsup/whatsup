import { computed, Computed } from './computed'

export class Linq<T> extends Computed<T[]> {
    readonly source: Computed<T[]>

    constructor(source: Computed<T[]>) {
        super()
        this.source = source
    }

    *stream() {
        return yield* this.source
    }

    filter(generator: (item: T) => Generator<unknown, boolean>) {
        return new Linq<T>(
            computed<T[]>(
                function* (this: Linq<T>) {
                    while (true) {
                        const items = yield* this
                        const result = [] as T[]

                        for (const item of items) {
                            if (yield* generator(item)) {
                                result.push(item)
                            }
                        }

                        yield result
                    }
                },
                { thisArg: this }
            )
        )
    }

    map<U>(generator: (item: T) => Generator<unknown, U>) {
        return new Linq<U>(
            computed<U[]>(
                function* (this: Linq<T>) {
                    while (true) {
                        const items = yield* this.source
                        const result = [] as U[]

                        for (const item of items) {
                            result.push(yield* generator(item))
                        }

                        yield result
                    }
                },
                { thisArg: this }
            )
        )
    }

    every(generator: (item: T) => Generator<unknown, boolean>) {
        return computed<boolean>(
            function* (this: Linq<T>) {
                while (true) {
                    const items = yield* this.source
                    let result = true

                    for (const item of items) {
                        if (!(yield* generator(item))) {
                            result = false
                        }
                    }

                    yield result
                }
            },
            { thisArg: this }
        )
    }

    some(generator: (item: T) => Generator<unknown, boolean>) {
        return computed<boolean>(
            function* (this: Linq<T>) {
                while (true) {
                    const items = yield* this.source
                    let result = false

                    for (const item of items) {
                        if (yield* generator(item)) {
                            result = true
                        }
                    }

                    yield result
                }
            },
            { thisArg: this }
        )
    }
}

export function linq<T>(source: Computed<T[]>) {
    return new Linq(source)
}
