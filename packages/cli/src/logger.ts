import readline from 'readline'

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

const makeRed = (text: string) => {
    return `${Color.Red}${text}${Color.Reset}`
}

const log = (text: string) => {
    process.stdout.write(`${text}\n`)
}

const green = (text: string) => {
    log(makeGreen(text))
}

const red = (text: string) => {
    log(makeRed(text))
}

const blue = (text: string) => {
    log(makeBlue(text))
}

const info = (text: string) => {
    log(`${makeBlue('ℹ')} ${text}`)
}

const success = (text: string) => {
    clear()
    log(`${makeGreen('✔')} ${text}`)
}

const failure = (text: string) => {
    clear()
    log(`${makeRed('✘')} ${text}`)
}

const clear = () => {
    readline.moveCursor(process.stdout, 0, -1)
    readline.clearLine(process.stdout, 1)
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
    red,
    blue,
    info,
    success,
    failure,
    title,
}
