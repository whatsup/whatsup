import { Stream } from './stream'
import { Cause } from './cause'
import { Atom } from './atom'

export type DataHandler<T> = (data: T) => void
export type ErrorHandler = (e: Error) => void

export class Observer<T> extends Cause<void> {
    readonly target: Stream<T>
    readonly onData: DataHandler<T>
    readonly onError: ErrorHandler

    constructor(
        target: Stream<T>,
        onData: DataHandler<T> = defaultDataHandler,
        onError: ErrorHandler = defaultErrorHandler
    ) {
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
        const atom = new Atom(this, null)
        atom.lazyBuild()
        return () => atom.dispose()
    }
}

function defaultDataHandler() {}

function defaultErrorHandler(e: Error) {
    throw e
}

export function whatsUp<T>(target: Stream<T>, onData?: DataHandler<T>, onError?: ErrorHandler) {
    const observer = new Observer(target, onData, onError)
    return observer.run()
}

// function normalizeSource<T>(source: Stream<T> | StreamGeneratorFunc<T>): Stream<T> {
//     if (source instanceof Stream) {
//         return source
//     }
//     return cause(source)
// }

// export function run<T>(source: Stream<T> | StreamGeneratorFunc<T>) {
//     const normalized = normalizeSource(source)
//     const onData = () => {}
//     const observer = new Observer(normalized, onData)

//     return observer.run()
// }
