export class Factor<T = unknown> {
    readonly defaultValue?: T
    readonly hasDefaultValue: boolean

    constructor(defaultValue?: T) {
        this.defaultValue = defaultValue
        this.hasDefaultValue = !!arguments.length
    }

    toString() {
        return `Factor ${this.constructor.name}`
    }
}

export const factor = <T>(defaultValue?: T) => {
    return new Factor(defaultValue)
}
