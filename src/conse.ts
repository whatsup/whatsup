import { Context } from './context'
import { SCHEDULER } from './scheduler'
import { Cause } from './cause'

export type ConseWatch<T> = (value: T) => void

export class Conse<T> extends Cause<T> {
    private contexts = new Set<Context>()
    private value: T
    private watch?: ConseWatch<T>

    constructor(value: T, watch?: ConseWatch<T>) {
        super()
        this.value = value
        this.watch = watch
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

    set(value: T) {
        this.value = value

        SCHEDULER.run(() => {
            for (const context of this.contexts) {
                context.update()
            }
        })

        if (this.watch) {
            this.watch(value)
        }
    }
}

export function conse<T>(value: T, watch?: ConseWatch<T>) {
    return new Conse(value, watch)
}
