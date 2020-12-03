import { StreamGeneratorFunc, Stream } from './stream'
import { sing } from './singularity'
import { Watcher } from './watcher'

function normalizeSource<T>(source: Stream<T> | StreamGeneratorFunc<T>): Stream<T> {
    if (source instanceof Stream) {
        return source
    }
    return sing(source)
}

export function run<T>(source: Stream<T> | StreamGeneratorFunc<T>) {
    const normalized = normalizeSource(source)
    const onData = () => {}
    const reaction = new Watcher(normalized, onData)

    return reaction.run()
}
