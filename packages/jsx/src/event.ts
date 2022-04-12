enum State {
    Default,
    Stopped,
    ImmediateStopped,
}

export type EventCtor<T extends Event> = new (...args: any[]) => T
export type EventListener<T extends Event> = (event: T) => void

export abstract class Event {
    private state = State.Default

    stopPropagation() {
        this.state = State.Stopped
    }

    stopImmediatePropagation() {
        this.state = State.ImmediateStopped
    }

    isPropagationStopped() {
        return this.state === State.Stopped || this.isPropagationImmediateStopped()
    }

    isPropagationImmediateStopped() {
        return this.state === State.ImmediateStopped
    }
}
