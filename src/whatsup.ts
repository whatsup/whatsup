import { Stream } from './stream'
import { Atom } from './atom'
import { transaction } from './scheduler'

export type DataHandler<T> = (data: T) => void
export type ErrorHandler = (e: Error) => void

export function whatsUp<T>(target: Stream<T>, onData?: DataHandler<T>, onError?: ErrorHandler) {
    function* generator() {
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
    }

    const atom = Atom.create(null, generator, undefined)

    transaction((t) => t.include(atom))

    return () => atom.dispose()
}
