import { createAtom, Atom, Producer } from './atom'

export class Computed<T = unknown> {
    /* @internal */
    readonly atom: Atom<T>

    constructor(producer: Producer<T>, thisArg?: unknown) {
        this.atom = createAtom(producer, thisArg)
    }

    get() {
        return this.atom.get()
    }
}

export function computed<T>(producer: Producer<T>, thisArg?: unknown) {
    return new Computed(producer, thisArg)
}
