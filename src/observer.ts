import { Stream } from './stream'
import { Cause } from './cause'
import { Atom } from './atom'

export type DataHandler<T> = (data: T) => void
export type ErrorHandler = (e: Error) => void

export class Observer<T> extends Cause<void> {
    readonly target: Stream<T>
    readonly onData: DataHandler<T>
    readonly onError: ErrorHandler

    constructor(target: Stream<T>, onData: DataHandler<T>, onError: ErrorHandler = defaultErrorHandler) {
        super()
        this.target = target
        this.onData = onData
        this.onError = onError
    }

    *whatsUp() {
        while (true) {
            try {
                const d = yield* this.target
                this.onData(d)
            } catch (e) {
                this.onError(e)
            }
            yield
        }
    }

    run() {
        const atom = new Atom(this, null)
        atom.lazyBuild()
        return () => atom.dispose()
    }
}

function defaultErrorHandler(e: Error) {
    throw e
}

export function whatsUp<T>(target: Stream<T>, onData: DataHandler<T>, onError?: ErrorHandler) {
    const observer = new Observer(target, onData, onError)
    return observer.run()
}
