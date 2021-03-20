import { Stream, StreamLike } from './stream'
import { Atom } from './atom'
import { transaction } from './scheduler'

export type DataHandler<T> = (data: T) => void
export type ErrorHandler = (e: Error) => void

export function whatsUp<T>(target: Stream<T>, onData?: DataHandler<T>, onError?: ErrorHandler) {
    const root = {
        *whatsUp() {
            while (true) {
                try {
                    const data = yield* target

                    if (onData) {
                        onData(data)
                    }
                } catch (e) {
                    if (onError) {
                        onError(e)
                    } else {
                        throw e
                    }
                }
                yield
            }
        },
    } as StreamLike<T>

    const atom = new Atom(root, null)

    transaction((t) => t.include(atom))

    return () => atom.dispose()
}

// function normalizeSource<T>(source: Stream<T> | StreamGeneratorFunc<T>): Stream<T> {
//     if (source instanceof Stream) {
//         return source
//     }
//     return cause(source)
// }

// export function run<T>(source: Stream<T> | StreamGeneratorFunc<T>) {
//     const normalized = normalizeSource(source)
//     const onData = () => {}
//     const observer = new Observer(normalized, onData)

//     return observer.run()
// }
