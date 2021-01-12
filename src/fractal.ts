import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { InitCommand } from './query'

export interface FractalOptions {
    thisArg?: any
}

export abstract class Fractal<T> extends Stream<T> {
    [Symbol.iterator](): Generator<never, T, any> {
        return super[Symbol.iterator](new InitCommand(this, { multi: true }))
    }
}

export function fractal<T>(generator: StreamGeneratorFunc<T>, { thisArg }: FractalOptions = {}): Fractal<T> {
    return new (class extends Fractal<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
