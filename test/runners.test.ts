import { fractal } from '../src/fractal'
import { fraction } from '../src/fraction'
import { exec, live } from '../src/runners'
import { Frame, LiveFrame } from '../src/frame'

describe('Runners', () => {
    it('exec runner', async () => {
        const Name = fraction('John')
        const Age = fraction(33)
        const Balance = fraction(60)

        const Wallet = fractal(async function* () {
            while (true) {
                yield `Wallet ${yield* Balance}`
            }
        })

        const User = fractal(async function* () {
            while (true) {
                yield `User ${yield* Name} ${yield* Age} ${yield* Wallet}`
            }
        })

        const frame = await exec(User)

        expect(frame).toStrictEqual(new Frame('User John 33 Wallet 60'))
    })

    it('live runner', async () => {
        const Name = fraction('John')
        const Age = fraction(33)
        const Balance = fraction(60)

        const Wallet = fractal(async function* () {
            while (true) {
                yield `Wallet ${yield* Balance}`
            }
        })

        const User = fractal(async function* () {
            while (true) {
                yield `User ${yield* Name} ${yield* Age} ${yield* Wallet}`
            }
        })

        const frame = await live(User)

        expect(frame).toStrictEqual(new LiveFrame('User John 33 Wallet 60', new Promise(() => {})))
    })

    it('exec runner when target is generator', async () => {
        const Name = fraction('John')
        const Age = fraction(33)
        const Balance = fraction(60)

        const Wallet = fractal(async function* () {
            while (true) {
                yield `Wallet ${yield* Balance}`
            }
        })

        const User = fractal(async function* () {
            while (true) {
                yield `User ${yield* Name} ${yield* Age} ${yield* Wallet}`
            }
        })

        const frame = await exec(async function* () {
            while (true) yield yield* User
        })

        expect(frame).toStrictEqual(new Frame('User John 33 Wallet 60'))
    })

    it('live runner when target is generator', async () => {
        const Name = fraction('John')
        const Age = fraction(33)
        const Balance = fraction(60)

        const Wallet = fractal(async function* () {
            while (true) {
                yield `Wallet ${yield* Balance}`
            }
        })

        const User = fractal(async function* () {
            while (true) {
                yield `User ${yield* Name} ${yield* Age} ${yield* Wallet}`
            }
        })

        const frame = await live(async function* () {
            while (true) yield yield* User
        })

        expect(frame).toStrictEqual(new LiveFrame('User John 33 Wallet 60', new Promise(() => {})))
    })
})
