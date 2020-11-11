export class Temporary<T> {
    constructor(readonly data: T | Promise<T>) {}
}

export function tmp<T>(data: T | Promise<T>) {
    return new Temporary(data)
}
