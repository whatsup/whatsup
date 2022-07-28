export abstract class Mutator<T> {
    abstract mutate(prev?: T): T
}

export class ShortMutator<T> extends Mutator<T> {
    readonly mutator: (prev?: T) => T

    constructor(mutator: (prev?: T) => T) {
        super()
        this.mutator = mutator
    }

    mutate(prev?: T) {
        return this.mutator(prev)
    }
}

export const mutator = <T>(cb: (prev?: T) => T) => {
    return new ShortMutator(cb)
}

/*
const increment = mutator((n = 0) => n + 1)
const decrement = mutator((n = 0) => n - 1)
*/

export const comparer = <T>(cb: (next: T, prev?: T) => boolean) => {
    return (next: T) =>
        mutator((prev?: T) => {
            if (cb(next, prev)) {
                return prev as T
            }

            return next
        })
}

/*
const equal = comparer<any>((next, prev)=> next === prev)
*/

export const filter = <T>(cb: (next: T) => boolean) => {
    return (next: T) =>
        mutator((prev?: T) => {
            if (cb(next)) {
                return next
            }

            return prev as T
        })
}

/*
const even = filter<number>((next)=> next % 2 === 0)
*/
