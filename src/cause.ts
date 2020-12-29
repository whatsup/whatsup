import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { InitCommand } from './query'

export interface CauseOptions {
    thisArg?: any
}

export abstract class Cause<T> extends Stream<T> {
    [Symbol.iterator](): Generator<never, T, any> {
        return super[Symbol.iterator](new InitCommand(this, { multi: false }))
    }
}

export function cause<T>(generator: StreamGeneratorFunc<T>, { thisArg }: CauseOptions = {}): Cause<T> {
    return new (class extends Cause<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
