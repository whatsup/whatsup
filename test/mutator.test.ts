import { observable } from '../src/observable'
import { computed } from '../src/computed'
import { mutator, Mutator } from '../src/mutator'
import { autorun } from '../src/reactions'

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
        const output = computed(function* () {
            const trigger = observable(0)

            kickstart = () => trigger.set(Math.random())

            try {
                while (true) {
                    trigger.get()
                    yield new Increment()
                }
            } finally {
                disposeMock()
            }
        })

        const dispose = autorun(() => (result = output.get()))

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
        const output = computed(function* () {
            const trigger = observable(0)

            kickstart = () => trigger.set(Math.random())

            while (true) {
                trigger.get()
                yield increment
            }
        })

        autorun(() => (result = output.get()))

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
