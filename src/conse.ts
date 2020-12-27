import { Context } from 'context'
import { Cause } from './cause'

export class Conse<T> extends Cause<T> {
    private value: T
    private update?: () => void

    constructor(value: T) {
        super()
        this.value = value
    }

    *whatsUp(ctx: Context) {
        while (true) {
            if (!this.update) {
                this.update = () => ctx.update()
            }
            yield this.value
        }
    }

    get() {
        return this.value
    }

    set(value: T) {
        this.value = value
        this.update && this.update()
    }
}

export function conse<T>(value: T) {
    return new Conse(value)
}
