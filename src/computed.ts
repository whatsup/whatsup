import { createAtom, Atom, Producer } from './atom'
import { Atomic } from './atomic'

export class Computed<T = unknown> implements Atomic<T> {
    /* @internal */
    readonly atom: Atom<T>

    constructor(producer: Producer<T>, thisArg?: unknown) {
        this.atom = createAtom(producer, thisArg)
    }

    get() {
        return this.atom.get()
    }
}

export const computed = <T>(producer: Producer<T>, thisArg?: unknown) => {
    return new Computed(producer, thisArg)
}
