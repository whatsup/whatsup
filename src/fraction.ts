import { Fractal, FractalOptions } from './fractal'
import { Context } from './context'
import { transaction } from './transaction'

export interface FractionOptions extends FractalOptions {}

export class Fraction<T> extends Fractal<T> {
    private contexts = new Set<Context>()
    protected value: T | Fractal<T>

    constructor(value: T | Fractal<T>, options: FractionOptions = {}) {
        super(options)
        this.value = value
    }

    *stream(context: Context) {
        this.contexts.add(context)

        try {
            while (true) {
                yield this.value
            }
        } finally {
            this.contexts.delete(context)
        }
    }

    get() {
        return this.value
    }

    set(value: T | Fractal<T>) {
        this.value = value

        transaction(() => {
            for (const context of this.contexts) {
                context.update()
            }
        })
    }
}

export function fraction<T>(value: T | Fractal<T>, options?: FractionOptions) {
    return new Fraction(value, options)
}
