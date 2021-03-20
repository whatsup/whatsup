import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { Handshake } from './command'
import { Result } from './result'

const init = new Handshake(true)

export abstract class Fractal<T> extends Stream<T> {
    [Symbol.iterator](): Generator<never, T, Result> {
        return super[Symbol.iterator](init.reuseWith(this))
    }
}

export function fractal<T>(generator: StreamGeneratorFunc<T>, thisArg?: unknown): Fractal<T> {
    return new (class extends Fractal<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
