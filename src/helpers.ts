import { Projection } from './typings'

export class Temporary<T> {
    constructor(readonly data: Projection<T>) {}
}

export function isTemporary<T>(arg: any): arg is Temporary<T> {
    return arg instanceof Temporary
}

export function tmp<T>(data: Projection<T>) {
    return new Temporary(data)
}

// TODO: maybe "asIs(Fractal)" helper need ??
// because default fractal converted to context capture generator
