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

export function computed<T>(generator: CollectGeneratorFunc<T>, options?: ComputedOptions): Computed<T> {
    return new (class extends Computed<T> {
        stream(controller: Controller): CollectGenerator<T> {
            return generator.call(this, controller)
        }
    })(options)
}
