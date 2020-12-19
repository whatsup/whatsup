import { ExclusiveAtomizer } from './atomizer'
import { Context } from './context'
import { DelegatingStream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface FractalOptions {
    thisArg?: any
}

export abstract class Fractal<T> extends DelegatingStream<T> {
    protected readonly atomizer: ExclusiveAtomizer<T>
    protected abstract whatsUp(context: Context): StreamGenerator<T | Fractal<T>>

    constructor() {
        super()
        this.atomizer = new ExclusiveAtomizer(this)
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
