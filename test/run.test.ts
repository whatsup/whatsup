import { fractal } from '../src/fractal'
import { fraction } from '../src/fraction'
import { run } from '../src/run'

describe('Runners', () => {
    const delay = (time: number) => new Promise((r) => setTimeout(r, time))

    it(`live should return destroyer`, () => {
        const mock = jest.fn()
        const User = fractal(function* () {
            try {
                while (true) {
                    yield ''
                }
            } finally {
                mock()
            }
        })

        const destroy = run(User)

        destroy()

        expect(mock).toBeCalledTimes(1)
    })

    it(`should take iterator`, () => {
        const mock = jest.fn()

        const st = stream(function* () {
            try {
                yield 'hello'
            } finally {
                mock()
            }
        })

        expect((await st.next()).value).toBe('hello')

        st.return()

        await delay(50)

        expect(mock).toBeCalledTimes(1)
    })

    it(`should throw error when emitter has error`, () => {
        const Trigger = fraction(true)

        const st = stream(function* () {
            while (true) {
                if (yield* Trigger) {
                    yield 'Good'
                } else {
                    throw 'Bad'
                }
            }
        })

        try {
            for await (const data of st) {
                expect(data).toBe('Good')
                Trigger.set(false)
            }
        } catch (e) {
            expect(e).toBe('Bad')
        }
    })
})
