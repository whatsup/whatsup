import { createAtom, Atom } from './atom'
import { Stream, Producer } from './stream'

export class Computed<T = unknown> extends Stream<T> {
    /* @internal */
    readonly atom: Atom<T>

    constructor(producer: Producer<T>, thisArg?: unknown) {
        super()
        this.atom = createAtom(producer, thisArg)
    }

    *[Symbol.iterator](): Generator<any, T, any> {
        return this.get()
    }

    get() {
        return this.atom.get()
    }
}

export function computed<T>(producer: Producer<T>, thisArg?: unknown) {
    return new Computed(producer, thisArg)
}
