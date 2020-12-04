import { fraction } from '../src/fraction'

describe('Fraction', () => {
    it(`get method should return current value`, () => {
        const f = fraction(1)

        expect(f.get()).toBe(1)
    })
})
