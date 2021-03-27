import { Stream } from './stream'

export class Command {}

export class Handshake extends Command {
    readonly multi!: boolean
    stream!: Stream

    constructor(multi: boolean) {
        super()
        this.multi = multi
    }

    // reusable
    // special for GC :)
    reuseWith(stream: Stream<unknown>) {
        this.stream = stream
        return this
    }
}
