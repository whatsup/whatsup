import { fractal } from './fractal'
import { EmitGeneratorFunc, Emitter, EmitterOptions } from './emitter'
import { Fork } from './fork'

interface Frame<T> {
    data: T
    next: Promise<Frame<T>>
}

class StreamFork<T> extends Fork<T> {
    private resolveNextFrame!: (data: T) => void
    private frame!: Promise<Frame<T>>

    constructor(emitter: Emitter<T>, consumer: Fork | null = null, context: Fork | null = null) {
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
            this.live()

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
    constructor(readonly target: Emitter<T>, options?: EmitterOptions) {
        super(options)
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
    return new StreamFork(root).stream()
}

export function live<T>(source: Emitter<T> | EmitGeneratorFunc<T>) {
    const emitter = normalizeSource(source)
    const root = new RootEmitter(emitter)
    const fork = new Fork(root)

    fork.live()

    return () => fork.destroy()
}

// export async function exec<T>(source: Emitter<T> | EmitGeneratorFunc<T>) {
//     const emitter = normalizeSource(source)
//     const root = new RootEmitter(emitter)
//     const fork = new Fork(root)

//     await fork.live()

//     const result = fork.getData()

//     fork.destroy()

//     return result as T
// }
