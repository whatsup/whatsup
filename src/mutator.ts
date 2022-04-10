export abstract class Mutator<T> {
    abstract mutate(prev?: T): T
}

export const mutator = <T>(cb: (prev?: T) => T) => {
    return new (class extends Mutator<T> {
        mutate(prev?: T) {
            return cb(prev)
        }
    })()
}

/* TODO:

export class Mutator<T> {
    readonly mutate: (prev?: T) => T

    constructor(mutate: (prev?: T) => T) {
        this.mutate = mutate
    }
}

export const mutator = <T>(cb: (prev?: T) => T) => {
    return new Mutator<T>(cb)
}

*/

/*
const increment = mutator((n = 0) => n + 1)
const decrement = mutator((n = 0) => n - 1)
*/
