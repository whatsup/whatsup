import { Fractal } from './fractal'
import { Context } from './context'
import { SCHEDULER } from './scheduler'

export class Fraction<T> extends Fractal<T> {
    private contexts = new Set<Context>()
    protected value: T | Fractal<T>

    constructor(value: T | Fractal<T>) {
        super()
        this.value = value
    }

    *whatsUp(context: Context) {
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

        SCHEDULER.run(() => {
            for (const context of this.contexts) {
                context.update()
            }
        })
    }
}

export function fraction<T>(value: T | Fractal<T>) {
    return new Fraction(value)
}
