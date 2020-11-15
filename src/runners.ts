import { EmitGeneratorFunc, Emitter, EmitterOptions } from './emitter'
import { Atom } from './atom'
import { fractal } from './fractal'

class Stream<T> extends Atom<T> {
    async *stream() {
        try {
            await this.activate()

            let { data } = this

            while (true) {
                yield data
                data = await this.nextData
            }
        } finally {
            this.destroy()
        }
    }
}

class RootEmitter<T> extends Emitter<T> {
    readonly target: Emitter<T>

    constructor(target: Emitter<T>, options?: EmitterOptions) {
        super(options)
        this.target = target
    }

    async *collector() {
        while (true) {
            yield yield* this.target
        }
    }
}

function normalizeSource<T>(source: Emitter<T> | EmitGeneratorFunc<T>) {
    if (source instanceof Emitter) {
        return source
    }
    return fractal(source)
}

export function stream<T>(source: Emitter<T> | EmitGeneratorFunc<T>) {
    const emitter = normalizeSource(source)
    const root = new RootEmitter(emitter)
    return new Stream(root).stream()
}

export function live<T>(source: Emitter<T> | EmitGeneratorFunc<T>) {
    const emitter = normalizeSource(source)
    const root = new RootEmitter(emitter)
    const atom = new Atom(root)

    atom.activate()

    return () => atom.destroy()
}
