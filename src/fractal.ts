import { Atom } from './atom'
import { Atomizer } from './atomizer'
import { ContextController } from './controller'
import { StreamOptions, Stream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface FractalOptions extends StreamOptions {}

export abstract class Fractal<T> extends Stream<T> {
    private readonly atomizer: Atomizer<T>
    protected abstract stream(controller: ContextController): StreamGenerator<T>

    constructor(options?: FractalOptions) {
        super(options)
        this.atomizer = new Atomizer(this)
    }

    protected getAtom(consumer: Atom) {
        return this.atomizer.get(consumer)
    }
}

export function fractal<T>(generator: StreamGeneratorFunc<T>, options?: FractalOptions): Fractal<T> {
    return new (class extends Fractal<T> {
        stream(controller: ContextController): StreamGenerator<T> {
            return generator.call(this, controller)
        }
    })(options)
}
