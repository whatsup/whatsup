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

export class EasyFractal<T> extends Fractal<T> {
    private readonly generator: CollectGeneratorFunc<T, ContextController>

    constructor(generator: CollectGeneratorFunc<T, ContextController>, options?: FractalOptions) {
        super(options)
        this.generator = generator
    }

    stream(controller: ContextController) {
        return this.generator(controller)
    }
}

export function fractal<T>(generator: CollectGeneratorFunc<T, ContextController>, options?: FractalOptions) {
    return new EasyFractal(generator, options)
}
