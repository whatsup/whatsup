import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { PushThrough, GetConsumer } from './command'
import { Cache, Err } from './cache'
import { Atom } from './atom'
import { GenerativeBuilder } from './builder'
import { spider } from './spider'

//const handshake = new MultiHandshake()
const getConsumer = new GetConsumer()
const pushThrough = new PushThrough()

export abstract class Fractal<T> extends Stream<T> {
    private readonly atoms: WeakMap<Atom, Atom>

    constructor() {
        super()
        this.atoms = new WeakMap()
    }

    *[Symbol.iterator](): Generator<never, T, Cache> {
        const consumer = ((yield getConsumer as never) as any) as Atom

        if (!this.atoms.has(consumer)) {
            const builder = new GenerativeBuilder(this.whatsUp, this)
            const context = new Context(consumer.context)
            const atom = new Atom(builder, context)

            this.atoms.set(consumer, atom)
        }

        const atom = this.atoms.get(consumer)!

        spider.watch(atom)

        const result = yield pushThrough.reuseWith(atom) as never

        if (result instanceof Err) {
            throw result.value
        }

        return result.value as T
    }
}

export function fractal<T>(generator: StreamGeneratorFunc<T>, thisArg?: unknown): Fractal<T> {
    return new (class extends Fractal<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
