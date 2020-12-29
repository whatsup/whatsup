import { InitCommand } from './query'
import { Context } from './context'
import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface FractalOptions {
    thisArg?: any
}

export abstract class Fractal<T> extends Stream<T> {
    abstract whatsUp(context: Context): StreamGenerator<T | Fractal<T>>

    [Symbol.iterator](): Generator<never, T, any> {
        return super[Symbol.iterator](new InitCommand(this, { multi: true }))
    }
}

export function fractal<T>(
    generator: StreamGeneratorFunc<T | Fractal<T>>,
    { thisArg }: FractalOptions = {}
): Fractal<T> {
    return new (class extends Fractal<T> {
        whatsUp(context: Context): StreamGenerator<T | Fractal<T>> {
            return generator.call(thisArg || this, context)
        }
    })()
}
