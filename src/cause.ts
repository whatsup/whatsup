import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { InitCommand } from './command'
import { Result } from './result'

const init = new InitCommand(false)

export abstract class Cause<T> extends Stream<T> {
    [Symbol.iterator](): Generator<never, T, Result> {
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
