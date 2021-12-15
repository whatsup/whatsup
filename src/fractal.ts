import { Stream, StreamGenerator, StreamGeneratorFunc, iterator } from './stream'
import { Context } from './context'
import { MultiHandshake } from './command'
import { Cache } from './cache'

const handshake = new MultiHandshake()

export abstract class Fractal<T> extends Stream<T> {
    [Symbol.iterator](): Generator<never, T, Cache> {
        return super[iterator](handshake.reuseWith(this))
    }
}

export function fractal<T>(generator: StreamGeneratorFunc<T>, thisArg?: unknown): Fractal<T> {
    return new (class extends Fractal<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
