enum Propagation {
    Default,
    Stopped,
    ImmediateStopped,
}

export type EventCtor<T extends Event = any> = new (...args: any[]) => T
export type EventListener<T extends Event = any> = (event: T) => void

export abstract class Event {
    private propagation = Propagation.Default

    stopPropagation() {
        this.propagation = Propagation.Stopped
    }

    stopImmediatePropagation() {
        this.propagation = Propagation.ImmediateStopped
    }

    isPropagationStopped() {
        return this.propagation === Propagation.Stopped || this.isPropagationImmediateStopped()
    }

    isPropagationImmediateStopped() {
        return this.propagation === Propagation.ImmediateStopped
    }
}
