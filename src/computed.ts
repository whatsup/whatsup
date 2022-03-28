import { atom, Atom } from './atom'
import { Stream, Producer } from './stream'

export class Computed<T = unknown> extends Stream<T> {
    protected atom: Atom<T>

    constructor(producer: Producer<T>, thisArg?: unknown) {
        super()
        this.atom = atom(null, producer, thisArg)
    }

    getAtomFor(): Atom<T> {
        return this.atom
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
