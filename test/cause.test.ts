import { run } from '../src/run'
import { cause } from '../src/cause'

describe('Cause', () => {
    it(`should substitute this`, () => {
        const mock = jest.fn()
        const thisArg = {}
        const fr = cause(function* (this: typeof thisArg) {
            mock(this)
            while (true) yield null
        }, thisArg)

        run(fr)

        expect(mock).toBeCalledWith(thisArg)
    })
})
