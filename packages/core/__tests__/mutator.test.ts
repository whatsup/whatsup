import { observable } from '../src/observable'
import { computed } from '../src/computed'
import { mutator } from '../src/mutator'
import { autorun } from '../src/reactions'

describe('Mutators', () => {
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
