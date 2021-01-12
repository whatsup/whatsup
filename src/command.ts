import { Stream } from './stream'

export class Command {}

export class InitCommand extends Command {
    readonly stream: Stream
    readonly multi: boolean

    constructor(stream: Stream<unknown>, multi: boolean) {
        super()
        this.stream = stream
        this.multi = multi
    }
}
