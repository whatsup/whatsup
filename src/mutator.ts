export abstract class Mutator<T> {
    abstract mutate(prev?: T): T
}

export function mutator<T>(cb: (prev?: T) => T) {
    return new (class extends Mutator<T> {
        mutate(prev?: T) {
            return cb(prev)
        }
    })()
}
/*
const increment = mutator((n = 0) => n + 1)
const decrement = mutator((n = 0) => n - 1)
*/
