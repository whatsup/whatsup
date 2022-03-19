import { Stream } from './stream'
import { Atom } from './atom'
import { transaction } from './scheduler'
import { Context } from './context'
import { GenBuilder } from './builder'

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
    const builder = new GenBuilder(generator, undefined)
    const atom = new Atom(builder, context)

    transaction((t) => t.include(atom))

    return () => atom.dispose()
}
