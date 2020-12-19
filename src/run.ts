import { StreamGeneratorFunc, Stream } from './stream'
import { computed } from './cause'
import { Watcher } from './watcher'

function normalizeSource<T>(source: Stream<T> | StreamGeneratorFunc<T>): Stream<T> {
    if (source instanceof Stream) {
        return source
    }
    return computed(source)
}

export function run<T>(source: Stream<T> | StreamGeneratorFunc<T>) {
    const normalized = normalizeSource(source)
    const onData = () => {}
    const reaction = new Watcher(normalized, onData)

    return reaction.run()
}
