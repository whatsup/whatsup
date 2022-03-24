import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { GetConsumer } from './command'
import { Cache } from './cache'
import { Atom } from './atom'
import { GenBuilder } from './builder'

//const handshake = new MultiHandshake()
const getConsumer = new GetConsumer()
//const pushThrough = new PushThrough()

export abstract class Fractal<T> extends Stream<T> {
    private readonly atoms: WeakMap<Atom, Atom<T>>

    constructor() {
        super()
        this.atoms = new WeakMap()
    }

    getAtomFor(consumer: Atom): Atom<T> {
        if (!this.atoms.has(consumer)) {
            const builder = new GenBuilder(this.whatsUp, this)
            const context = new Context(consumer.context)
            const atom = new Atom(builder, context)

            this.atoms.set(consumer, atom)
        }

        return this.atoms.get(consumer)!
    }

    *[Symbol.iterator](): Generator<never, T, Cache> {
        const consumer = ((yield getConsumer as never) as any) as Atom
        const atom = this.getAtomFor(consumer)

        return atom.get()
    }
}

export function fractal<T>(generator: StreamGeneratorFunc<T>, thisArg?: unknown): Fractal<T> {
    return new (class extends Fractal<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
