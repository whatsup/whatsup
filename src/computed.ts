import { createAtom, Atom } from './atom'
import { Atomic, Producer } from './atomic'

export class Computed<T = unknown> extends Atomic<T> {
    /* @internal */
    readonly atom: Atom<T>

    constructor(producer: Producer<T>, thisArg?: unknown) {
        super()
        this.atom = createAtom(producer, thisArg)
    }

    get() {
        return this.atom.get()
    }
}

export function computed<T>(producer: Producer<T>, thisArg?: unknown) {
    return new Computed(producer, thisArg)
}
