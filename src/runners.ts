import { createContext } from './context'
import { livening, executing, Builder } from './builders'
import { Fractal, isFractal } from './fractal'
import { Frame, LiveFrame } from './frame'
import { Bubble } from './typings'

async function run<T>(target: Fractal<T> | (() => AsyncGenerator<Bubble<T>, T>), builder: Builder<T>) {
    const generator = isFractal(target)
        ? async function* () {
              while (true) yield yield* target
          }
        : target
    const ctx = createContext<T>(null, generator, { name: 'Runner' })

    return builder(ctx)
}

export async function live<T>(target: Fractal<T> | (() => AsyncGenerator<Bubble<T>, T>)) {
    return run(target, livening) as Promise<LiveFrame<T>>
}

export async function exec<T>(target: Fractal<T> | (() => AsyncGenerator<Bubble<T>, T>)) {
    return run(target, executing) as Promise<Frame<T>>
}
