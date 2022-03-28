import { whatsUp } from '../src/whatsup'
import { component } from '../src/component'

describe('Component', () => {
    it(`should substitute this`, () => {
        const mock = jest.fn()
        const thisArg = {}
        const fr = component(function* (this: typeof thisArg) {
            mock(this)
            while (true) yield null
        }, thisArg)

        whatsUp(fr)

        expect(mock).toBeCalledWith(thisArg)
    })
})
