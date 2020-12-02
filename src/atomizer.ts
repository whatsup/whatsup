import { Atom } from './atom'
import { Context } from './context'
import { Stream } from './stream'

export class Atomizer<T> {
    private readonly stream: Stream<T>
    private readonly parentContext: Context | null
    private readonly atoms = new WeakMap<Atom, Atom>()

    constructor(stream: Stream<T>, parentContext: Context | null = null) {
        this.stream = stream
        this.parentContext = parentContext
    }

    get(consumer: Atom) {
        if (!this.atoms.has(consumer)) {
            const parentContext = this.parentContext || consumer.getContext()
            const atom = new Atom(this.stream, parentContext)

            this.atoms.set(consumer, atom)
        }

        return this.atoms.get(consumer)!
    }
}
