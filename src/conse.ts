import { Context } from './context'
import { transaction } from './scheduler'
import { Cause } from './cause'
import { Delegation } from './delegation'

export class Conse<T> extends Cause<T> {
    private contexts = new Set<Context>()
    private value: T | Delegation<T>

    constructor(value: T | Delegation<T>) {
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

    set(value: T | Delegation<T>) {
        this.value = value

        transaction(() => {
            for (const context of this.contexts) {
                context.update()
            }
        })
    }
}

export function conse<T>(value: T | Delegation<T>) {
    return new Conse(value)
}
