import { whatsUp } from '../src/whatsup'
import { Observable } from '../src/observable'
import { Computed } from '../src/computed'

describe('Computed', () => {
    it(`should react on observable change`, () => {
        const mock = jest.fn()
        const observable = new Observable(1)
        const computed = new Computed(() => observable.get() + 1)

        whatsUp(computed as any, mock)

        expect(mock).toBeCalledWith(2)

        observable.set(2)

        expect(mock).toBeCalledWith(3)
    })

    it(`should react on many observables`, () => {
        const mock = jest.fn()
        const one = new Observable(1)
        const two = new Observable(2)
        const computed = new Computed(() => one.get() + two.get())

        whatsUp(computed as any, mock)

        expect(mock).toBeCalledWith(3)

        one.set(2)

        expect(mock).toBeCalledWith(4)

        two.set(3)

        expect(mock).toBeCalledWith(5)
    })
})
