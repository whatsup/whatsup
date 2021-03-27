import { conse } from '../src/conse'

describe('Conse', () => {
    it(`should return current value`, () => {
        const name = conse('John')

        expect(name.get()).toBe('John')
    })
})
