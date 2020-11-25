import { Atom } from './atom'
import { Atomizer } from './atomizer'
import { ContextController } from './controller'
import { StreamOptions, Stream, CollectGenerator, CollectGeneratorFunc } from './stream'

export interface FractalOptions extends StreamOptions {}

export abstract class Fractal<T> extends Stream<T> {
    private readonly atomizer: Atomizer<T>
    protected abstract stream(controller: ContextController): CollectGenerator<T>

    constructor(options?: FractalOptions) {
        super(options)
        this.atomizer = new Atomizer(this)
    }

    protected getAtom(consumer: Atom) {
        return this.atomizer.get(consumer)
    }
}

export function fractal<T>(generator: CollectGeneratorFunc<T>, options?: FractalOptions): Fractal<T> {
    return new (class extends Fractal<T> {
        stream(controller: ContextController): CollectGenerator<T> {
            return generator.call(this, controller)
        }
    })(options)
}
