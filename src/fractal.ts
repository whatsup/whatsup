import { ExclusiveAtomizer } from './atomizer'
import { Context } from './context'
import { StreamOptions, DelegatingStream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface FractalOptions extends StreamOptions {}

export abstract class Fractal<T> extends DelegatingStream<T> {
    protected readonly atomizer: ExclusiveAtomizer<T>
    protected abstract stream(context: Context): StreamGenerator<T | Fractal<T>>

    constructor(options?: FractalOptions) {
        super(options)
        this.atomizer = new ExclusiveAtomizer(this)
    }
}

export function fractal<T>(generator: StreamGeneratorFunc<T | Fractal<T>>, options?: FractalOptions): Fractal<T> {
    return new (class extends Fractal<T> {
        stream(context: Context): StreamGenerator<T | Fractal<T>> {
            return generator.call(this, context)
        }
    })(options)
}
