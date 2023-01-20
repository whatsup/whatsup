export type Mutator<T> = (prev?: T) => T

export const isMutator = <T>(target: any): target is Mutator<T> => {
    return typeof target === 'function'
}

/*
const equal = comparer<any>((next, prev)=> next === prev)
*/

export const comparer = <T>(cb: (next: T, prev?: T) => boolean) => {
    return (next: T) => {
        return (prev?: T) => {
            if (cb(next, prev)) {
                return prev as T
            }

            return next
        }
    }
}

/*
const even = filter<number>((next)=> next % 2 === 0)
*/

export const filter = <T>(cb: (next: T) => boolean) => {
    return (next: T) => {
        return (prev?: T) => {
            if (cb(next)) {
                return next
            }

            return prev as T
        }
    }
}
