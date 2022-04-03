import { Atom, atom } from './atom'
import { Producer } from './stream'

export class Splitter<T> {
    private readonly map: WeakMap<Atom, Atom<T>>
    private readonly producer: Producer<T>
    private readonly thisArg: unknown

    constructor(producer: Producer<T>, thisArg: unknown) {
        this.map = new WeakMap()
        this.producer = producer
        this.thisArg = thisArg
    }

    getFor(consumer: Atom) {
        if (!this.map.has(consumer)) {
            const { producer, thisArg } = this
            const dependency = atom(consumer.context, producer, thisArg) as Atom<T>

            this.map.set(consumer, dependency)
        }

        return this.map.get(consumer)!
    }
}
