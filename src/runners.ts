import { CollectGeneratorFunc, Stream } from './stream'
import { EasyComputed } from './computed'
import { Reaction } from './reaction'

function normalizeSource<T>(source: Stream<T> | CollectGeneratorFunc<T>): Stream<T> {
    if (source instanceof Stream) {
        return source
    }
    return new EasyComputed(source)
}

export function run<T>(source: Stream<T> | CollectGeneratorFunc<T>) {
    const normalized = normalizeSource(source)
    const onData = () => {}
    const reaction = new Reaction(normalized, onData)

    return reaction.run()
}
