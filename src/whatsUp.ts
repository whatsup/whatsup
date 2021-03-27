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
