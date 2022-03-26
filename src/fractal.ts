import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { GET_CONSUMER } from './symbols'
import { Cache } from './cache'
import { Atom } from './atom'

export abstract class Fractal<T> extends Stream<T> {
    private readonly atoms: WeakMap<Atom, Atom<T>>

    constructor() {
        super()
        this.atoms = new WeakMap()
    }

    getAtomFor(consumer: Atom): Atom<T> {
        if (!this.atoms.has(consumer)) {
            const atom = Atom.create(consumer.context, this.whatsUp, this) as Atom<T>

            this.atoms.set(consumer, atom)
        }

        return this.atoms.get(consumer)!
    }

    *[Symbol.iterator](): Generator<never, T, Cache> {
        const consumer = ((yield GET_CONSUMER as never) as any) as Atom
        const atom = this.getAtomFor(consumer)

        return atom.get()
    }
}

export function fractal<T>(generator: StreamGeneratorFunc<T>, thisArg?: unknown): Fractal<T> {
    return new (class extends Fractal<T> {
        *whatsUp(context: Context): StreamGenerator<T> {
            return yield* generator.call(thisArg || this, context)
        }
    })()
}
