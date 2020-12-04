import { Stream } from './stream'
import { Computed } from './computed'

export type DataHandler<T> = (data: T) => void
export type ErrorHandler = (e: Error) => void

export class Watcher<T> extends Computed<void> {
    readonly target: Stream<T>
    readonly onData: DataHandler<T>
    readonly onError: ErrorHandler

    constructor(target: Stream<T>, onData: DataHandler<T>, onError: ErrorHandler = defaultErrorHandler) {
        super()
        this.target = target
        this.onData = onData
        this.onError = onError
    }

    *stream() {
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

export function watch<T>(target: Stream<T>, onData: DataHandler<T>, onError?: ErrorHandler) {
    const watcher = new Watcher(target, onData, onError)
    return watcher.run()
}
