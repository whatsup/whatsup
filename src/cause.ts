import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { InitCommand } from './command'
import { Result } from './result'

export interface CauseOptions {
    thisArg?: unknown
}

export abstract class Cause<T> extends Stream<T> {
    [Symbol.iterator](): Generator<never, T, Result> {
        return super[Symbol.iterator](new InitCommand({ stream: this, multi: false }))
    }
}

export function cause<T>(generator: StreamGeneratorFunc<T>, { thisArg }: CauseOptions = {}): Cause<T> {
    return new (class extends Cause<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
