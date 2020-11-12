import { Scope } from './fork'

export class Factor<T> {
    private scopes = new WeakMap<Scope<any>, T>()

    constructor(readonly defaultValue?: T) {}

    get(scope: Scope<any>) {
        let { context } = scope

        while (context) {
            if (this.scopes.has(context)) {
                return this.scopes.get(context)
            }
            context = context.context
        }

        return this.defaultValue
    }

    set(scope: Scope<any>, value: T) {
        this.scopes.set(scope, value)
    }
}

export function factor<T>(defaultValue?: T) {
    return new Factor(defaultValue)
}
