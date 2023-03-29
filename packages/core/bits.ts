const DIRTY = 1 << 0 //  00000001
const CHECK = 1 << 1 //  00000010
const ACTUAL = 1 << 2 // 00000100

console.log('DIRTY ', DIRTY, DIRTY.toString(2).padStart(8, '0'))
console.log('CHECK ', CHECK, CHECK.toString(2).padStart(8, '0'))
console.log('ACTUAL', ACTUAL, ACTUAL.toString(2).padStart(8, '0'))
console.log('\n')

let state = 0

const log = (n: number) => n.toString(2).padStart(8, '0')
const logState = () => console.log('State ', log(state), '\n')
//const logFlag = (n: number) => console.log('Flag ', n, '>>', log(n), '\n')

// -----

logState()

console.log(':: DIRTY > CHECK \n')
//state ^= ACTUAL
state = DIRTY ^ (DIRTY | CHECK)

console.log('is DIRTY ', !!(state & DIRTY))
console.log('is CHECK ', !!(state & CHECK))
console.log('is ACTUAL', !!(state & ACTUAL))

logState()

// -----

logState()

console.log(':: DIRTY > ACTUAL \n')
//state ^= ACTUAL
state = DIRTY ^ (DIRTY | ACTUAL)

console.log('is DIRTY ', !!(state & DIRTY))
console.log('is CHECK ', !!(state & CHECK))
console.log('is ACTUAL', !!(state & ACTUAL))

logState()

// -----

console.log(':: CHECK > ACTUAL \n')

state = CHECK ^ (CHECK | ACTUAL)

console.log('is DIRTY ', !!(state & DIRTY))
console.log('is CHECK ', !!(state & CHECK))
console.log('is ACTUAL', !!(state & ACTUAL))

logState()

// -----

console.log(':: CHECK > DIRTY \n')

state = CHECK ^ (CHECK | DIRTY)

console.log('is DIRTY ', !!(state & DIRTY))
console.log('is CHECK ', !!(state & CHECK))
console.log('is ACTUAL', !!(state & ACTUAL))

logState()

// -----

console.log(':: ACTUAL > DIRTY \n')

state = ACTUAL ^ (ACTUAL | DIRTY)

console.log('is DIRTY ', !!(state & DIRTY))
console.log('is CHECK ', !!(state & CHECK))
console.log('is ACTUAL', !!(state & ACTUAL))

logState()

// -----

console.log(':: ACTUAL > CHECK \n')

state = ACTUAL ^ (ACTUAL | CHECK)

console.log('is DIRTY ', !!(state & DIRTY))
console.log('is CHECK ', !!(state & CHECK))
console.log('is ACTUAL', !!(state & ACTUAL))

logState()

// -----

console.log(':: ACTUAL | CHECK > DIRTY \n')

state = ACTUAL
state

console.log('is DIRTY ', !!(state & DIRTY))
console.log('is CHECK ', !!(state & CHECK))
console.log('is ACTUAL', !!(state & ACTUAL))

logState()
