import { Stream } from './stream'
import { Atom } from './atom'
import { transaction } from './scheduler'
import { Context } from './context'

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

    const context = new Context()
    const atom = Atom.create(context, generator, undefined)

    transaction((t) => t.include(atom))

    return () => atom.dispose()
}
