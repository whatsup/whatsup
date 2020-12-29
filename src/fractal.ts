import { InitCommand } from './query'
//import { ExclusiveAtomizer } from './atomizer'
import { Context } from './context'
import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface FractalOptions {
    thisArg?: any
}

export abstract class Fractal<T> extends Stream<T> {
    //protected readonly atomizer: ExclusiveAtomizer<T>
    abstract whatsUp(context: Context): StreamGenerator<T | Fractal<T>>

    // constructor() {
    //     super()
    //     this.atomizer = new ExclusiveAtomizer(this)
    // }

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
