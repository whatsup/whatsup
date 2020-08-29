import { Bubble } from './typings'

export type FrameData<T> = T | (() => AsyncIterator<Bubble<T>, T>)

export class Frame<T> {
    constructor(readonly data: FrameData<T>) {}
}

export class LiveFrame<T> extends Frame<T> {
    constructor(data: FrameData<T>, readonly next: Promise<LiveFrame<T>>) {
        super(data)
    }
}

export function isFrame<T>(arg: any): arg is Frame<T> {
    return arg instanceof Frame
}

export function isLiveFrame<T>(arg: any): arg is LiveFrame<T> {
    return arg instanceof LiveFrame
}
