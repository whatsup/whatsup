import { Stream } from './stream'

export class Command {}

export interface InitOptions {
    stream: Stream<unknown>
    multi: boolean
}

export class InitCommand extends Command {
    readonly stream: Stream
    readonly multi: boolean

    constructor({ stream, multi }: InitOptions) {
        super()
        this.stream = stream
        this.multi = multi
    }
}
