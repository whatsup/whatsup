import { Atomic } from './atomic'

export class Delegation<T> {
    constructor(public readonly source: Atomic<T>) {}
}

const MAP = new WeakMap<Atomic, Delegation<any>>()

export const delegate = <T>(source: Atomic<T>) => {
    if (!MAP.has(source)) {
        MAP.set(source, new Delegation(source))
    }
    return MAP.get(source) as Delegation<T>
}
