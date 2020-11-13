import { Context } from './context'

export class Factor<T> {
    readonly defaultValue?: T
    private contexts = new WeakMap<Context, T>()

    constructor(defaultValue?: T) {
        this.defaultValue = defaultValue
    }

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

    set(context: Context, value: T) {
        this.contexts.set(context, value)
    }
}

export function factor<T>(defaultValue?: T) {
    return new Factor(defaultValue)
}
