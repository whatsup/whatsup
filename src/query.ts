import { Stream } from './stream'

export class Command {
    constructor(_: CommandOptions) {}
}
export class CommandOptions {}

export interface InitOptions extends CommandOptions {
    multi: boolean
}

export class InitCommand extends Command {
    readonly stream: Stream<any>
    readonly multi: boolean

    constructor(stream: Stream<any>, { multi, ...other }: InitOptions) {
        super(other)
        this.stream = stream
        this.multi = multi
    }
}
