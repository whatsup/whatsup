import { whatsUp } from '../src/whatsup'
import { Observable } from '../src/observable'

describe('Observable', () => {
    it(`should react on change`, () => {
        const mock = jest.fn()
        const observable = new Observable(1)

        whatsUp(observable as any, mock)

        expect(mock).toBeCalledWith(1)

        observable.set(2)

        expect(mock).toBeCalledWith(2)
    })
})
