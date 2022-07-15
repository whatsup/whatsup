enum Color {
    Reset = '\x1b[0m',
    Green = '\x1b[32m',
    Blue = '\x1b[34m',
    Red = '\x1b[31m',
    Cyan = '\x1b[36m',
}

const makeGreen = (text: string) => {
    return `${Color.Green}${text}${Color.Reset}`
}

const makeBlue = (text: string) => {
    return `${Color.Blue}${text}${Color.Reset}`
}

const log = (text: string) => {
    process.stdout.write(`${text}\n`)
}

const green = (text: string) => {
    log(makeGreen(text))
}

const blue = (text: string) => {
    log(makeBlue(text))
}

const start = (text: string) => {
    log(`${makeBlue('ℹ')} ${text}`)
}

const end = (text: string) => {
    clear()
    log(`${makeGreen('✓')} ${text}`)
}

const clear = () => {
    process.stdout.moveCursor(0, -1)
    process.stdout.clearLine(1)
}

const title = () => {
    log('````````````````````````````````````````````')
    log('`                                          `')
    log('`   ' + makeGreen('Welcome to WHATSUP project generator') + '   `')
    log('`                                          `')
    log('````````````````````````````````````````````')
}

export const logger = {
    log,
    green,
    blue,
    start,
    end,
    clear,
    title,
}
