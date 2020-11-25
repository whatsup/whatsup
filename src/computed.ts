import { ComputedAtom } from './atom'
import { Controller } from './controller'
import { StreamOptions, Stream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface ComputedOptions extends StreamOptions {}

export abstract class Computed<T> extends Stream<T> {
    protected readonly atom: ComputedAtom
    protected abstract stream(controller: Controller): StreamGenerator<T>

    constructor(options?: ComputedOptions) {
        super(options)
        this.atom = new ComputedAtom(this)
    }

    protected getAtom() {
        return this.atom
    }
}

export function computed<T>(generator: StreamGeneratorFunc<T>, options?: ComputedOptions): Computed<T> {
    return new (class extends Computed<T> {
        stream(controller: Controller): StreamGenerator<T> {
            return generator.call(this, controller)
        }
    })(options)
}
