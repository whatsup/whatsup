import { Emitter, EmitterOptions } from './emitter'
import { Context } from './context'

export interface FractionOptions extends EmitterOptions {}

export class Fraction<T> extends Emitter<T> {
    private contexts = new Set<Context>()
    protected data: T

    constructor(value: T, options: FractionOptions = {}) {
        super(options)
        this.data = value
    }

    async *collector(context: Context) {
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

        for (const context of this.contexts) {
            context.update()
        }
    }

    use(value: T) {
        this.set(value)
    }
}

export function fraction<T>(value: T, options?: FractionOptions) {
    return new Fraction(value, options)
}
