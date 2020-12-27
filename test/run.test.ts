import { fractal } from '../src/fractal'
import { run } from '../src/run'

describe('Run', () => {
    it(`should take stream and return disposer`, () => {
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

        const dispose = run(User)

        dispose()

        expect(mock).toBeCalledTimes(1)
    })

    it(`should take iterator and return disposer`, () => {
        const mock = jest.fn()

        const dispose = run(function* () {
            try {
                yield 'hello'
            } finally {
                mock()
            }
        })

        dispose()

        expect(mock).toBeCalledTimes(1)
    })
})
