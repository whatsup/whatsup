import { Fractal, FractalOptions } from './fractal'
import { Context } from './context'
import { initTransaction } from 'transaction'

export interface FractionOptions extends FractalOptions {}

export class Fraction<T> extends Fractal<T> {
    private contexts = new Set<Context>()
    protected data: T

    constructor(value: T, options: FractionOptions = {}) {
        super(options)
        this.data = value
    }

    *collector(context: Context) {
        this.contexts.add(context)

        try {
            while (true) {
                yield this.data
            }
        } finally {
            this.contexts.delete(context)
        }
    }

    get() {
        return this.data
    }

    set(value: T) {
        this.data = value

        const transaction = initTransaction(this)

        for (const context of this.contexts) {
            context.update()
        }

        transaction.run(this)
    }
}

export function fraction<T>(value: T, options?: FractionOptions) {
    return new Fraction(value, options)
}
