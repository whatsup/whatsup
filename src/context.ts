import { Fractal } from './fractal'
import { isContextQuery } from './queries'
import { Bubble } from './typings'

export interface Context<T> {
    readonly name: string
    readonly generator: () => AsyncIterator<Bubble<T>, T>
    readonly stack: AsyncIterator<Bubble<T>, T>[]
}

export interface ContextOptions {
    name: string
}

export function createContext<T>(
    root: null | Context<T>,
    generator: () => AsyncIterator<Bubble<T>, T>,
    params: ContextOptions
): Context<T> {
    const { name } = params

    return Object.create(root, {
        name: {
            value: name,
        },
        generator: {
            value: generator,
        },
        stack: {
            value: [],
        },
    })
}

export function contextCapture<T>(Target: Fractal<T>, ctx: Context<T>) {
    return async function* capture() {
        const iterator = Target[Symbol.asyncIterator]() as AsyncIterator<Bubble<T>, T>

        let input: any

        while (true) {
            const { done, value } = await iterator.next(input)

            if (done) {
                return value as T
            }
            if (isContextQuery(value)) {
                input = ctx
                continue
            }

            input = yield value as Bubble<T>
        }
    }
}
