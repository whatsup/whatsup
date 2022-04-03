import { Stream, Producer } from './stream'
import { GET_CONSUMER } from './symbols'
import { Atom } from './atom'
import { Splitter } from './splitter'

export class Component<T = unknown> extends Stream<T> {
    private readonly splitter: Splitter<T>

    constructor(producer: Producer<T>, thisArg?: unknown) {
        super()
        this.splitter = new Splitter(producer, thisArg)
    }

    getAtomFor(consumer: Atom): Atom<T> {
        return this.splitter.getFor(consumer)!
    }

    *[Symbol.iterator](): Generator<any, T, any> {
        const consumer = (yield GET_CONSUMER) as Atom
        const atom = this.getAtomFor(consumer)

        return atom.get()
    }
}

export function component<T>(producer: Producer<T>, thisArg?: unknown) {
    return new Component(producer, thisArg)
}
