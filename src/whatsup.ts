import { Stream } from './stream'
import { createAtom } from './atom'
import { transaction } from './scheduler'

export type DataHandler<T> = (data: T) => void
export type ErrorHandler = (e: Error) => void

export const whatsUp = <T>(target: Stream<T>, onData?: DataHandler<T>, onError?: ErrorHandler) => {
    function* WhatsUp() {
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

    const root = createAtom(WhatsUp, undefined)

    transaction((t) => t.addEntry(root))

    return () => root.dispose()
}
