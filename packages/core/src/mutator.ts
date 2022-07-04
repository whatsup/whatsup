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
