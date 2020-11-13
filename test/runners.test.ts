import { fractal } from '../src/fractal'
import { live, stream } from '../src/runners'

describe('Runners', () => {
    const delay = (time: number) => new Promise((r) => setTimeout(r, time))

    it(`live should return destroyer`, async () => {
        const mock = jest.fn()
        const User = fractal(async function* () {
            try {
                while (true) {
                    yield ''
                }
            } finally {
                mock()
            }
        })

        const destroy = live(User)

        await delay(50)

        destroy()

        await delay(50)

        expect(mock).toBeCalledTimes(1)
    })

    it(`should take async iterator`, async () => {
        const mock = jest.fn()

        const st = stream(async function* () {
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
})
