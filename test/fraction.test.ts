import { fraction } from '../src/fraction'

describe('Fraction', () => {
    it(`should return current data`, async () => {
        const fr = fraction(33)
        expect(fr.get()).toBe(33)
    })
})
