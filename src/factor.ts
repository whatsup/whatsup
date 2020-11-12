import { Context } from './context'

export class Factor<T> {
    private contexts = new WeakMap<Context, T>()

    constructor(readonly defaultValue?: T) {}

    get(context: Context) {
        let source = context.parent

        while (source) {
            if (this.contexts.has(source)) {
                return this.contexts.get(source)
            }
            source = source.parent
        }

        return this.defaultValue
    }

    set(scope: Context, value: T) {
        this.contexts.set(scope, value)
    }
}

export function factor<T>(defaultValue?: T) {
    return new Factor(defaultValue)
}
