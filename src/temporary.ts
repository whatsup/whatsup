export class Temporary<T> {
    readonly data: T | Promise<T>

    constructor(data: T | Promise<T>) {
        this.data = data
    }
}

export function tmp<T>(data: T | Promise<T>) {
    return new Temporary(data)
}
