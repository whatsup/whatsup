import { Stream, Producer } from './stream'
import { GET_CONSUMER } from './symbols'
import { atom, Atom } from './atom'

class Atomizer<T> {
    private readonly map: WeakMap<Atom, Atom<T>>
    private readonly producer: Producer<T>
    private readonly thisArg: unknown

    constructor(producer: Producer<T>, thisArg: unknown) {
        this.map = new WeakMap()
        this.producer = producer
        this.thisArg = thisArg
    }

    get(consumer: Atom) {
        if (!this.map.has(consumer)) {
            const { producer, thisArg } = this
            const dependency = atom(consumer.context, producer, thisArg) as Atom<T>

            this.map.set(consumer, dependency)
        }

        return this.map.get(consumer)!
    }
}

export class Component<T = unknown> extends Stream<T> {
    private readonly atomizer: Atomizer<T>

    constructor(producer: Producer<T>, thisArg?: unknown) {
        super()
        this.atomizer = new Atomizer(producer, thisArg)
    }

    getAtomFor(consumer: Atom): Atom<T> {
        return this.atomizer.get(consumer)!
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
