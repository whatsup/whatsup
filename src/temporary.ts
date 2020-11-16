export class Temporary<T> {
    readonly data: T

    constructor(data: T) {
        this.data = data
    }
}

export function tmp<T>(data: T) {
    return new Temporary(data)
}
