import { ComputedAtom } from './atom'
import { Controller } from './controller'
import { StreamOptions, Stream, CollectGenerator, CollectGeneratorFunc } from './stream'

export interface ComputedOptions extends StreamOptions {}

export abstract class Computed<T> extends Stream<T> {
    protected readonly atom: ComputedAtom
    protected abstract stream(controller: Controller): CollectGenerator<T>

    constructor(options?: ComputedOptions) {
        super(options)
        this.atom = new ComputedAtom(this)
    }

    protected getAtom() {
        return this.atom
    }
}

export class EasyComputed<T> extends Computed<T> {
    private readonly generator: CollectGeneratorFunc<T>

    constructor(generator: CollectGeneratorFunc<T>, options?: ComputedOptions) {
        super(options)
        this.generator = generator
    }

    stream(controller: Controller) {
        return this.generator(controller)
    }
}

export function computed<T>(generator: CollectGeneratorFunc<T>, options?: ComputedOptions) {
    return new EasyComputed(generator, options)
}
