import { createAtom, Producer } from './atom'
import { transaction } from './scheduler'

export type DataHandler<T> = (data: T, prevData?: T | undefined) => void
export type ErrorHandler = (e: Error) => void

export const reaction = <T>(producer: Producer<T>, onData: DataHandler<T>, onError?: ErrorHandler) => {
    let prev: T | undefined = undefined

    const source = createAtom(producer)
    const atom = createAtom(() => {
        try {
            const data = source.get()

            onData(data, prev)

            prev = data
        } catch (e) {
            if (onError) {
                onError(e as Error)
            }
        }
    })

    transaction((t) => t.addEntry(atom))

    return () => atom.dispose()
}

export const autorun = <T>(producer: Producer<T>) => {
    const atom = createAtom(producer)

    transaction((t) => t.addEntry(atom))

    return () => atom.dispose()
}
