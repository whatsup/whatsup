import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { InitCommand } from './command'
import { Result } from './result'

export interface FractalOptions {
    thisArg?: unknown
}

export abstract class Fractal<T> extends Stream<T> {
    [Symbol.iterator](): Generator<never, T, Result> {
        return super[Symbol.iterator](new InitCommand({ stream: this, multi: true }))
    }
}

export function fractal<T>(generator: StreamGeneratorFunc<T>, { thisArg }: FractalOptions = {}): Fractal<T> {
    return new (class extends Fractal<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
