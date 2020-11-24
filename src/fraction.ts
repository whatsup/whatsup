import { Fractal, FractalOptions } from './fractal'
import { Controller } from './controller'
import { transaction } from './transaction'

export interface FractionOptions extends FractalOptions {}

export class Fraction<T> extends Fractal<T> {
    private controllers = new Set<Controller>()
    protected value: T

    constructor(value: T, options: FractionOptions = {}) {
        super(options)
        this.value = value
    }

    *stream(controller: Controller) {
        this.controllers.add(controller)

        try {
            while (true) {
                yield this.value
            }
        } finally {
            this.controllers.delete(controller)
        }
    }

    get() {
        return this.value
    }

    set(value: T) {
        this.value = value

        transaction(() => {
            for (const controller of this.controllers) {
                controller.update()
            }
        })
    }
}

export function fraction<T>(value: T, options?: FractionOptions) {
    return new Fraction(value, options)
}
