import { Context, contextCapture } from './context'
import { Fractal, isFractal } from './fractal'
import { isContextQuery, isBuilderQuery } from './queries'
import { Frame, LiveFrame, FrameData, isFrame, isLiveFrame } from './frame'
import { Temporary, isTemporary } from './helpers'
import { isAsyncGenerator, equal } from './utils'
import { Bubble } from './typings'

export type Builder<T> = (ctx: Context<T>, ...args: any[]) => Promise<Frame<T> | LiveFrame<T>>

interface BuildResult<T> {
    readonly data: FrameData<T>
    readonly racers: Promise<Frame<T>>[]
}

async function build<T>(ctx: Context<T>, builder: Builder<T>): Promise<BuildResult<T>> {
    const { stack, generator } = ctx
    const racers = [] as Promise<any>[]

    if (!stack.length) {
        stack.push(generator.call(void 0))
    }

    let input: any

    while (true) {
        const lastIndex = stack.length - 1
        const iterator = stack[lastIndex]
        const { done, value } = await iterator.next(input)

        if (done) {
            stack.pop()

            if (stack.length) {
                input = value
                continue
            }
        }
        if (isContextQuery(value)) {
            input = ctx
            continue
        }
        if (isBuilderQuery(value)) {
            input = builder
            continue
        }
        if (isLiveFrame(value)) {
            racers.push(value.next)
        }
        if (isFrame(value)) {
            const { data } = value

            if (isAsyncGenerator<Bubble<T>, T>(data)) {
                stack.push(data())
                input = void 0
            } else {
                input = data as T
            }
            continue
        }

        const data = await async function prepare(value: T | Temporary<T> | Fractal<T>): Promise<FrameData<T>> {
            if (isTemporary(value)) {
                racers.push(Promise.resolve())
                return prepare(await value.data)
            }
            if (isFractal(value)) {
                return contextCapture(value, ctx)
            }
            return value
        }.call(void 0, value)

        return { data, racers }
    }
}

const LIVE_FRAMES_MAP = new WeakMap<Context<any>, LiveFrame<any>>()

export async function livening<T>(ctx: Context<T>, forceUpdate = false): Promise<LiveFrame<T>> {
    const isLiveFrameExists = LIVE_FRAMES_MAP.has(ctx)

    if (!isLiveFrameExists || forceUpdate) {
        const { data, racers } = await build(ctx, livening)
        const next = Promise.race(racers).then(() => livening(ctx, true))

        if (isLiveFrameExists) {
            const currentLiveFrame = LIVE_FRAMES_MAP.get(ctx)!

            if (equal(currentLiveFrame.data, data)) {
                return next
            }
        }

        const liveFrame = new LiveFrame(data, next)

        LIVE_FRAMES_MAP.set(ctx, liveFrame)
    }

    return LIVE_FRAMES_MAP.get(ctx)!
}

export async function executing<T>(ctx: Context<T>): Promise<Frame<T>> {
    const { data } = await build<T>(ctx, executing)
    return new Frame(data)
}
