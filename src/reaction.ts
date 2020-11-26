import { Stream } from './stream'
import { Computed } from './computed'

type DataHandler<T> = (data: T) => void
type ErrorHandler = (e: Error) => void

export class Reaction<T> extends Computed<void> {
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
        return () => this.atom.destroy()
    }
}

function defaultErrorHandler(e: Error) {
    throw e
}

export function reaction<T>(target: Stream<T>, onData: DataHandler<T>, onError?: ErrorHandler) {
    const reaction = new Reaction(target, onData, onError)
    return reaction.run()
}
