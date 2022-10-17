import { Computed, isComputed, isObservable, Observable } from '@whatsup/core'

export const isGenerator = (target: Function): target is () => Generator => {
    return target.constructor.name === 'GeneratorFunction'
}

export const extractAtomicValue = <T>(value: T | Computed<T> | Observable<T>): T => {
    if (isComputed<T>(value) || isObservable<T>(value)) {
        return value()
    }

    return value
}

export function* flatten<T>(iterator: IterableIterator<T>) {
    for (const item of iterator) {
        if (Array.isArray(item)) {
            yield* item
        } else {
            yield item
        }
    }
}
