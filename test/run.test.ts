import { fractal } from '../src/fractal'
import { run } from '../src/run'

describe('Run', () => {
    it(`should take stream and return destroyer`, () => {
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

    it(`should take iterator and return destroyer`, () => {
        const mock = jest.fn()

        const destroy = run(function* () {
            try {
                yield 'hello'
            } finally {
                mock()
            }
        })

        destroy()

        expect(mock).toBeCalledTimes(1)
    })
})
