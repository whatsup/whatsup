import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { Handshake } from './command'
import { Cache } from './cache'

const init = new Handshake(false)

export abstract class Cause<T> extends Stream<T> {
    [Symbol.iterator](): Generator<never, T, Cache> {
        return super[Symbol.iterator](init.reuseWith(this))
    }
}

export function cause<T>(generator: StreamGeneratorFunc<T>, thisArg?: unknown): Cause<T> {
    return new (class extends Cause<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
