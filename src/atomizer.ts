import { Atom, FractalAtom } from './atom'
import { ContextController } from './controller'
import { Fractal } from './fractal'

export class Atomizer<T> {
    private readonly fractal: Fractal<T>
    private readonly parentController: ContextController | null
    private readonly atoms = new WeakMap<Atom, Atom>()

    constructor(fractal: Fractal<T>, parentController: ContextController | null = null) {
        this.fractal = fractal
        this.parentController = parentController
    }

    get(consumer: Atom) {
        if (!this.atoms.has(consumer)) {
            const controller = this.parentController || consumer.getController()
            const parentController = controller instanceof ContextController ? controller : null
            const atom = new FractalAtom(this.fractal, parentController)

            this.atoms.set(consumer, atom)
        }

        return this.atoms.get(consumer)!
    }
}
