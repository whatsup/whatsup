import { Atom } from './atom'

const STACK = [] as Set<Atom>[]

const start = () => {
    STACK.push(new Set())
}

const watch = (atom: Atom) => {
    if (STACK.length) {
        STACK[STACK.length - 1].add(atom)
        return true
    }
    return false
}

const stop = () => {
    return STACK.pop()!
}

export const spider = {
    watch,
    start,
    stop,
}
