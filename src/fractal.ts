import { EmitGeneratorFunc, Emitter, EmitterOptions } from './emitter'
import { Context } from './context'

export interface FractalOptions extends EmitterOptions {}

export class Fractal<T> extends Emitter<T> {
    private readonly generator: EmitGeneratorFunc<T>

    constructor(generator: EmitGeneratorFunc<T>, options: FractalOptions = {}) {
        super(options)
        this.generator = generator
    }

    async *collector(context: Context) {
        return yield* this.generator(context)
    }
}

export function fractal<T>(generator: EmitGeneratorFunc<T>, options?: FractalOptions) {
    return new Fractal(generator, options)
}
