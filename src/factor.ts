export class Factor<T = unknown> {
    readonly defaultValue?: T

    constructor(defaultValue?: T) {
        this.defaultValue = defaultValue
    }
}

export function factor<T>(defaultValue?: T) {
    return new Factor(defaultValue)
}
