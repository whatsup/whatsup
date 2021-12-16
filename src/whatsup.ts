import { Stream, StreamLike } from './stream'
import { Atom } from './atom'
import { transaction } from './scheduler'
import { Context } from './context'

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
                        onError(e as Error)
                    }
                }
                yield
            }
        },
    } as StreamLike<T>

    const context = new Context()
    const atom = new Atom(root, context)

    transaction((t) => t.include(atom))

    return () => atom.dispose()
}
