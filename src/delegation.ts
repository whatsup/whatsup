import { Stream } from './stream'

export class Delegation<T> {
    constructor(public readonly stream: Stream<T>) {}
}

const MAP = new WeakMap<Stream<any>, Delegation<any>>()

export function delegate<T>(stream: Stream<T>) {
    if (!MAP.has(stream)) {
        MAP.set(stream, new Delegation(stream))
    }
    return MAP.get(stream) as Delegation<T>
}
