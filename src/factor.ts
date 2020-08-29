import { ContextQuery } from './queries'

export interface Factor<T> {
    (value?: T): AsyncGenerator<any, void, any>
    is(value: T): AsyncGenerator<any, boolean, any>
    [Symbol.asyncIterator](): AsyncGenerator<any, T, any>
}

export function factor<T>(defaultValue?: T): Factor<T> {
    const sym = Symbol('Factor')

    async function* mrFactor(value?: T) {
        const ctx = yield ContextQuery
        ctx[sym] = value
    }

    return Object.defineProperties(mrFactor, {
        is: {
            async *value(value: T) {
                return (yield* this) === value
            },
        },
        [Symbol.asyncIterator]: {
            async *value() {
                const ctx = yield ContextQuery
                const parent = Object.getPrototypeOf(ctx)
                const value = parent[sym]
                return value === undefined ? defaultValue : value
            },
        },
    })
}
