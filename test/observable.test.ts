import { whatsUp } from '../src/whatsup'
import { observable } from '../src/observable'

describe('Observable', () => {
    it(`should react on change`, () => {
        const mock = jest.fn()
        const num = observable(1)

        whatsUp(num as any, mock)

        expect(mock).toBeCalledWith(1)

        num.set(2)

        expect(mock).toBeCalledWith(2)
    })

    it(`should return current value`, () => {
        const name = observable('John')

        expect(name.get()).toBe('John')
    })
})
