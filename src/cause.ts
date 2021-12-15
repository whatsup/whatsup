import { Stream, StreamGenerator, StreamGeneratorFunc, iterator } from './stream'
import { Context } from './context'
import { SimpleHandshake } from './command'
import { Cache } from './cache'

const handshake = new SimpleHandshake()

export abstract class Cause<T> extends Stream<T> {
    [Symbol.iterator](): Generator<never, T, Cache> {
        return super[iterator](handshake.reuseWith(this))
    }
}

export function cause<T>(generator: StreamGeneratorFunc<T>, thisArg?: unknown): Cause<T> {
    return new (class extends Cause<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
