import { EmitGeneratorFunc, Emitter, EmitterOptions } from './emitter'
import { Tree } from './fork'

export interface FractalOptions extends EmitterOptions {}

export class Fractal<T> extends Emitter<T> {
    private readonly generator: EmitGeneratorFunc<T>

    constructor(generator: EmitGeneratorFunc<T>, options: FractalOptions = {}) {
        super(options)
        this.generator = generator
    }

    async *collector(tree: Tree<T>) {
        return yield* this.generator(tree)
    }
}

export function fractal<T>(generator: EmitGeneratorFunc<T>, options?: FractalOptions) {
    return new Fractal(generator, options)
}
