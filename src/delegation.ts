import { Atomic } from './atomic'

export class Delegation<T> {
    constructor(public readonly stream: Atomic<T>) {}
}

const MAP = new WeakMap<Atomic, Delegation<unknown>>()

export const delegate = <T>(stream: Atomic<T>) => {
    if (!MAP.has(stream)) {
        MAP.set(stream, new Delegation(stream))
    }
    return MAP.get(stream) as Delegation<T>
}
