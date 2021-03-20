import { whatsUp } from '../src/whatsUp'
import { fractal } from '../src/fractal'

describe('Fractal', () => {
    it(`should substitute this`, () => {
        const mock = jest.fn()
        const thisArg = {}
        const fr = fractal(function* (this: typeof thisArg) {
            mock(this)
            while (true) yield null
        }, thisArg)

        whatsUp(fr)

        expect(mock).toBeCalledWith(thisArg)
    })
})
