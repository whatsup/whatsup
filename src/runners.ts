import { fractal } from './fractal'
import { EmitGeneratorFunc, Emitter, EmitterOptions } from './emitter'
import { Atom } from './atom'

interface Frame<T> {
    data: T
    next: Promise<Frame<T>>
}

class Stream<T> extends Atom<T> {
    private resolveNextFrame!: (data: T) => void
    private frame!: Promise<Frame<T>>

    constructor(emitter: Emitter<T>, consumer: Atom | null = null, context: Atom | null = null) {
        super(emitter, consumer, context)
        this.createFramePromise()
    }

    destroy() {
        super.destroy()
        this.createFramePromise()
    }

    protected setData(data: T) {
        super.setData(data)
        this.resolveNextFrame(data)
    }

    private createFramePromise() {
        return (this.frame = new Promise((r) => {
            this.resolveNextFrame = (data: T) => {
                r({ data, next: this.createFramePromise() })
            }
        }))
    }

    async *stream() {
        try {
            this.activate()

            let { frame } = this

            while (true) {
                const { data, next } = await frame
                yield data
                frame = next
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
