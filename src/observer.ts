import { Stream } from './stream'
import { Cause } from './cause'

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
                this.onData(yield* this.target)
            } catch (e) {
                this.onError(e)
            }
            yield
        }
    }

    run() {
        this.atom.update()
        return () => this.atom.dispose()
    }
}

function defaultErrorHandler(e: Error) {
    throw e
}

export function whatsUp<T>(target: Stream<T>, onData: DataHandler<T>, onError?: ErrorHandler) {
    const observer = new Observer(target, onData, onError)
    return observer.run()
}
