import { Atom, FractalAtom } from './atom'
import { Context, RootContext } from './context'
import { Fractal } from './fractal'

export class Atomizer<T> {
    private readonly fractal: Fractal<T>
    private readonly parentContext: Context | RootContext | null
    private readonly atoms = new WeakMap<Atom, Atom>()

    constructor(fractal: Fractal<T>, parentContext: Context | RootContext | null = null) {
        this.fractal = fractal
        this.parentContext = parentContext
    }

    get(consumer: Atom) {
        if (!this.atoms.has(consumer)) {
            const parentContext = this.parentContext || consumer.getContext()
            const atom = new FractalAtom(this.fractal, parentContext)

            this.atoms.set(consumer, atom)
        }

        return this.atoms.get(consumer)!
    }
}
