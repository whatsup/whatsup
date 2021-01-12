import { fractal } from '../src/fractal'
import { mutator, Mutator } from '../src/mutator'
import { whatsUp } from '../src/observer'

describe('Mutators', () => {
    describe('test mutators', () => {
        let result: any
        let kickstart: () => void
        const disposeMock = jest.fn()
        class Increment extends Mutator<number> {
            mutate(prev = 0) {
                return prev + 1
            }
        }
        const Output = fractal(function* (ctx) {
            kickstart = () => ctx.update()

            try {
                while (true) {
                    yield new Increment()
                }
            } finally {
                disposeMock()
            }
        })

        const dispose = whatsUp(Output, (r) => (result = r))

        it(`should return 1`, () => {
            expect(result).toBe(1)
        })

        it(`should return 2`, () => {
            kickstart()
            expect(result).toBe(2)
        })

        it(`should return 3`, () => {
            kickstart()
            expect(result).toBe(3)
        })

        it(`should dispose & mock call`, () => {
            dispose()
            expect(disposeMock).toBeCalledTimes(1)
        })
    })

    describe('test shorthand', () => {
        let result: any
        let kickstart: () => void
        const increment = mutator<number>((prev = 0) => prev + 1)
        const Output = fractal(function* (ctx) {
            kickstart = () => ctx.update()

            while (true) {
                yield increment
            }
        })

        whatsUp(Output, (r) => (result = r))

        it(`should return 1`, () => {
            expect(result).toBe(1)
        })

        it(`should return 2`, () => {
            kickstart()
            expect(result).toBe(2)
        })

        it(`should return 3`, () => {
            kickstart()
            expect(result).toBe(3)
        })
    })
})
